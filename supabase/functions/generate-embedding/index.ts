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
 * 4. Demand post (M4.7): receives { type: 'DEMAND', record: { id, text } }
 *    -> calls HF with pre-built text, updates demand_posts.embedding
 * 5. Business profile (unified search): receives { type: 'BUSINESS', record: { id, text } }
 *    -> calls HF with pre-built text, updates business_profiles.embedding
 * 6. Profile (unified search): receives { type: 'PROFILE', record: { id, text } }
 *    -> calls HF with pre-built text, updates profiles.embedding
 * 7. Backfill accepts { backfill: true, table?: 'products' | 'businesses' | 'profiles' }
 *    (default: products)
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
//   Production:  npx supabase secrets set ALLOWED_ORIGIN=https://telopillo
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
 * Edge-side text builders for businesses / profiles. Only used by the
 * backfill mode — the database triggers send pre-built text (built by the
 * SQL builders in the migration) so trigger and backfill wording stays
 * identical: name repeated twice, description truncated to ~150 words.
 */
function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : text
}

function buildBusinessEmbeddingText(record: Record<string, unknown>): string {
  const name = String(record.business_name ?? '')
  const parts: string[] = []
  if (name) {
    parts.push(name)
    parts.push(`Negocio: ${name}`)
  }
  if (record.business_category) {
    parts.push(String(record.business_category))
  }
  if (record.business_description) {
    parts.push(`Descripción: ${truncateWords(String(record.business_description), 150)}`)
  }
  return parts.join('. ')
}

interface ProfileWithBusiness {
  id: string
  full_name?: string | null
  business?: {
    business_name?: string | null
    business_category?: string | null
    business_description?: string | null
  } | null
}

function buildProfileEmbeddingText(record: ProfileWithBusiness): string {
  const name = String(record.full_name ?? '')
  const biz = record.business
  const parts: string[] = []
  if (name) {
    parts.push(name)
    parts.push(`Vendedor: ${name}`)
  }
  if (biz?.business_name) {
    parts.push(String(biz.business_name))
  }
  if (biz?.business_category) {
    parts.push(String(biz.business_category))
  }
  if (biz?.business_description) {
    parts.push(`Descripción: ${truncateWords(String(biz.business_description), 150)}`)
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
      return json({ error: 'Falta el encabezado de autorización' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const body = await req.json()

    // --- Modes 5/6: Business / Profile embedding (unified search) ---
    // Same contract as DEMAND: the DB trigger sends pre-built text.
    if (body.type === 'BUSINESS' || body.type === 'PROFILE') {
      const table = body.type === 'BUSINESS' ? 'business_profiles' : 'profiles'
      const record = body.record
      if (!record?.id || !record?.text?.trim()) {
        return json({ error: 'Falta el id o el texto' }, 400)
      }

      const embedding = await callHuggingFace(record.text)
      if (!embedding) {
        return json({ error: 'No se pudo generar el embedding' }, 500)
      }

      const { error } = await supabase.from(table).update({ embedding }).eq('id', record.id)

      if (error) {
        console.error(`Supabase update error (${table}):`, error)
        return json({ error: 'No se pudo guardar el embedding en la base de datos' }, 500)
      }
      return json({ success: true, table, id: record.id })
    }

    // --- Backfill for businesses / profiles (products backfill below) ---
    if (body.backfill === true && (body.table === 'businesses' || body.table === 'profiles')) {
      const batchLimit = Math.min(body.limit ?? 50, 100)
      const isBusiness = body.table === 'businesses'
      const table = isBusiness ? 'business_profiles' : 'profiles'

      let rows: ProfileWithBusiness[] = []
      const businessColumns = 'id, business_name, business_category, business_description'
      const batch = isBusiness
        ? await supabase
            .from('business_profiles')
            .select(businessColumns)
            .is('embedding', null)
            .limit(batchLimit)
        : await supabase
            .from('profiles')
            .select('id, full_name')
            .is('embedding', null)
            .limit(batchLimit)

      if (batch.error) {
        console.error('[generate-embedding] Backfill fetch error:', batch.error)
        return json({ error: 'No se pudieron leer las filas para el proceso' }, 500)
      }

      if (isBusiness) {
        rows = (batch.data ?? []) as ProfileWithBusiness[]
      } else {
        const profileRows = batch.data ?? []
        // Merge owning-business context so profile embeddings cover what the
        // seller sells, not just their name.
        const businessMap = new Map<string, ProfileWithBusiness['business']>()
        if (profileRows.length > 0) {
          const { data: bizRows } = await supabase
            .from('business_profiles')
            .select('id, business_name, business_category, business_description')
            .in(
              'id',
              profileRows.map((r) => r.id)
            )
          for (const b of bizRows ?? []) {
            businessMap.set(b.id, b)
          }
        }
        rows = profileRows.map((r) => ({ ...r, business: businessMap.get(r.id) ?? null }))
      }

      if (rows.length === 0) {
        return json({
          message: 'Ninguna fila necesita embedding',
          processed: 0,
          remaining: 0,
        })
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      for (const row of rows) {
        const text = isBusiness ? buildBusinessEmbeddingText(row) : buildProfileEmbeddingText(row)
        if (!text?.trim()) {
          failed++
          errors.push(`${row.id}: sin texto`)
          continue
        }

        const embedding = await callHuggingFace(text)
        if (!embedding) {
          failed++
          errors.push(`${row.id}: falló el servicio de embedding`)
          continue
        }

        const { error: updateError } = await supabase
          .from(table)
          .update({ embedding })
          .eq('id', row.id)

        if (updateError) {
          failed++
          console.error(`[generate-embedding] Backfill update error for ${row.id}:`, updateError)
          errors.push(`${row.id}: error al guardar el embedding`)
        } else {
          success++
        }
      }

      const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .is('embedding', null)

      return json({
        table: body.table,
        processed: success + failed,
        success,
        failed,
        remaining: count ?? 0,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // --- Mode 3: Backfill (batch generate embeddings for products missing them) ---
    if (body.backfill === true) {
      const batchLimit = Math.min(body.limit ?? 50, 100)

      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, description, category, subcategory')
        .is('embedding', null)
        .limit(batchLimit)

      if (fetchError) {
        console.error('[generate-embedding] Backfill fetch error:', fetchError)
        return json({ error: 'No se pudieron leer los productos para el proceso' }, 500)
      }

      if (!products || products.length === 0) {
        return json({ message: 'Ningún producto necesita embedding', processed: 0, remaining: 0 })
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      for (const product of products) {
        const text = buildProductText(product)
        if (!text?.trim()) {
          failed++
          errors.push(`${product.id}: sin texto`)
          continue
        }

        const embedding = await callHuggingFace(text)
        if (!embedding) {
          failed++
          errors.push(`${product.id}: falló el servicio de embedding`)
          continue
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id)

        if (updateError) {
          failed++
          console.error(
            `[generate-embedding] Backfill update error for ${product.id}:`,
            updateError
          )
          errors.push(`${product.id}: error al guardar el embedding`)
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

    // --- Mode 4: Demand post embedding (M4.7) ---
    if (body.type === 'DEMAND') {
      const record = body.record
      if (!record?.id || !record?.text?.trim()) {
        return json({ error: 'Falta el id de la solicitud o el texto' }, 400)
      }

      const embedding = await callHuggingFace(record.text)
      if (!embedding) {
        return json({ error: 'No se pudo generar el embedding de la solicitud' }, 500)
      }

      const { error } = await supabase
        .from('demand_posts')
        .update({ embedding })
        .eq('id', record.id)

      if (error) {
        console.error('Supabase update error (demand_posts):', error)
        return json({ error: 'No se pudo actualizar la solicitud en la base de datos' }, 500)
      }
      return json({ success: true, demand_post_id: record.id })
    }

    // --- Mode 1: Database Webhook (product INSERT/UPDATE) ---
    if (body.type === 'INSERT' || body.type === 'UPDATE') {
      const record = body.record ?? body.new_record ?? body
      const productId = record.id
      const text = buildProductText(record)
      if (!text?.trim()) {
        return json({ error: 'No hay texto para generar el embedding' }, 400)
      }

      const embedding = await callHuggingFace(text)
      if (!embedding) {
        return json({ error: 'No se pudo generar el embedding' }, 500)
      }

      const { error } = await supabase.from('products').update({ embedding }).eq('id', productId)

      if (error) {
        console.error('Supabase update error:', error)
        return json({ error: 'No se pudo actualizar el producto en la base de datos' }, 500)
      }
      return json({ success: true, product_id: productId })
    }

    // --- Mode 2: Direct text (search query embedding) ---
    const { text } = body
    if (!text?.trim()) {
      return json({ error: 'Falta el texto' }, 400)
    }

    const embedding = await callHuggingFace(text)
    if (!embedding) {
      return json({ error: 'No se pudo generar el embedding' }, 500)
    }

    return json({ embedding })
  } catch (e) {
    console.error('generate-embedding error:', e)
    return json({ error: 'Ocurrió un error inesperado' }, 500)
  }
})
