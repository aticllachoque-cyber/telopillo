/**
 * M4: Generate embeddings via Hugging Face Inference API
 *
 * Invocation modes:
 * 1. Database Webhook (product INSERT/UPDATE): receives { type, table, record }
 *    -> builds text from product, calls HF, updates products.embedding
 * 2. Direct text (search query): receives { text: "..." }
 *    -> returns { embedding: number[] }
 * 3. Backfill: receives { backfill: true, limit?: number }
 *    -> finds products without embeddings, generates and stores them
 *
 * Model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384 dims)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`

const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 1000

// SECURITY: Require ALLOWED_ORIGIN to be explicitly set (no fallback)
// Set via:
//   Development: npx supabase secrets set ALLOWED_ORIGIN=http://localhost:3003
//   Production:  npx supabase secrets set ALLOWED_ORIGIN=https://telopillo.bo
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN')
if (!ALLOWED_ORIGIN) {
  throw new Error(
    'SECURITY: ALLOWED_ORIGIN environment variable must be set. ' +
      'Use: npx supabase secrets set ALLOWED_ORIGIN=<your-origin>'
  )
}

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(obj: object, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Build structured text for embedding generation.
 * Title is repeated to boost its weight in the embedding vector,
 * ensuring title-relevant queries rank the correct product higher.
 * Description is truncated to ~150 words to prevent dilution.
 */
function buildProductText(record: Record<string, unknown>): string {
  const parts: string[] = []
  const title = String(record.title ?? '')

  if (title) {
    // Repeat title twice to boost its signal in the embedding
    parts.push(title)
    parts.push(`Producto: ${title}`)
  }
  if (record.description) {
    // Truncate long descriptions to ~150 words to prevent title dilution
    const desc = String(record.description)
    const words = desc.split(/\s+/)
    const truncated = words.length > 150 ? words.slice(0, 150).join(' ') + '...' : desc
    parts.push(`Descripción: ${truncated}`)
  }
  if (record.category || record.subcategory) {
    const catParts = [record.category, record.subcategory].filter(Boolean)
    parts.push(`Categoría: ${catParts.join(', ')}`)
  }

  return parts.join('. ')
}

/**
 * Call Hugging Face Inference API with retry logic.
 * Retries up to MAX_RETRIES times with exponential backoff for transient errors.
 */
async function callHuggingFace(text: string): Promise<number[] | null> {
  const HF_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY')
  if (!HF_TOKEN) {
    console.error('HUGGINGFACE_API_KEY not set')
    return null
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(HF_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      })

      // Retry on 503 (model loading), 429 (rate limit), 500 (server error)
      if (
        (res.status === 503 || res.status === 429 || res.status >= 500) &&
        attempt < MAX_RETRIES
      ) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        console.warn(
          `HF API returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      if (!res.ok) {
        console.error('HF API error:', res.status, await res.text())
        return null
      }

      const data = await res.json()
      // HF returns [[...384 floats]] or [...384 floats] depending on endpoint
      const embedding = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data
      if (!Array.isArray(embedding) || embedding.length !== 384) {
        console.error(
          'Invalid embedding shape:',
          Array.isArray(embedding) ? embedding.length : typeof embedding
        )
        return null
      }
      return embedding
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        console.warn(
          `HF API fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`,
          err
        )
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      console.error('HF API fetch error after retries:', err)
      return null
    }
  }

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const body = await req.json()

    // --- Mode 3: Backfill (batch generate embeddings for products missing them) ---
    if (body.backfill === true) {
      const batchLimit = Math.min(body.limit ?? 50, 100)

      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, description, category, subcategory')
        .is('embedding', null)
        .limit(batchLimit)

      if (fetchError) {
        return json({ error: fetchError.message }, 500)
      }

      if (!products || products.length === 0) {
        return json({ message: 'No products need embeddings', processed: 0, remaining: 0 })
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      for (const product of products) {
        const text = buildProductText(product)
        if (!text?.trim()) {
          failed++
          errors.push(`${product.id}: no text`)
          continue
        }

        const embedding = await callHuggingFace(text)
        if (!embedding) {
          failed++
          errors.push(`${product.id}: HF failed`)
          continue
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id)

        if (updateError) {
          failed++
          errors.push(`${product.id}: ${updateError.message}`)
        } else {
          success++
        }
      }

      // Check remaining
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .is('embedding', null)

      return json({
        processed: success + failed,
        success,
        failed,
        remaining: count ?? 0,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // --- Mode 1: Database Webhook (product INSERT/UPDATE) ---
    if (body.type === 'INSERT' || body.type === 'UPDATE') {
      const record = body.record ?? body.new_record ?? body
      const productId = record.id
      const text = buildProductText(record)
      if (!text?.trim()) {
        return json({ error: 'No text to embed' }, 400)
      }

      const embedding = await callHuggingFace(text)
      if (!embedding) {
        return json({ error: 'HF embedding failed' }, 500)
      }

      const { error } = await supabase.from('products').update({ embedding }).eq('id', productId)

      if (error) {
        console.error('Supabase update error:', error)
        return json({ error: error.message }, 500)
      }
      return json({ success: true, product_id: productId })
    }

    // --- Mode 2: Direct text (search query embedding) ---
    const { text } = body
    if (!text?.trim()) {
      return json({ error: 'Missing text' }, 400)
    }

    const embedding = await callHuggingFace(text)
    if (!embedding) {
      return json({ error: 'HF embedding failed' }, 500)
    }

    return json({ embedding })
  } catch (e) {
    console.error('generate-embedding error:', e)
    return json({ error: String(e) }, 500)
  }
})
