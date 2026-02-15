import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  category?: string
  priceMin?: number
  priceMax?: number
  department?: string
  condition?: string
  status?: string
  sellerType?: 'business' | 'personal'
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// ---------------------------------------------------------------------------
// Feature flag: semantic search enabled
// ---------------------------------------------------------------------------
async function isSemanticSearchEnabled(supabase: SupabaseClient): Promise<boolean> {
  if (process.env.SEMANTIC_SEARCH_ENABLED === 'true') return true
  if (process.env.SEMANTIC_SEARCH_ENABLED !== undefined) return false
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'semantic_search_enabled')
    .single()
  if (error) return false
  return data?.value === 'true'
}

// ---------------------------------------------------------------------------
// Query embedding cache (in-memory, TTL-based)
// ---------------------------------------------------------------------------
interface CacheEntry {
  embedding: number[]
  expiresAt: number
}

const EMBEDDING_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX_SIZE = 200

function getCachedEmbedding(query: string): number[] | null {
  const entry = EMBEDDING_CACHE.get(query)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    EMBEDDING_CACHE.delete(query)
    return null
  }
  return entry.embedding
}

function setCachedEmbedding(query: string, embedding: number[]): void {
  // Evict oldest entries if cache is full
  if (EMBEDDING_CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = EMBEDDING_CACHE.keys().next().value
    if (firstKey) EMBEDDING_CACHE.delete(firstKey)
  }
  EMBEDDING_CACHE.set(query, {
    embedding,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// ---------------------------------------------------------------------------
// Get query embedding (with cache)
// ---------------------------------------------------------------------------
async function getQueryEmbedding(
  text: string
): Promise<{ embedding: number[] | null; cached: boolean }> {
  const normalizedQuery = text.toLowerCase().trim()

  // Check cache first
  const cached = getCachedEmbedding(normalizedQuery)
  if (cached) {
    return { embedding: cached, cached: true }
  }

  // Call Edge Function
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) return { embedding: null, cached: false }

  const { embedding } = await res.json()
  if (!Array.isArray(embedding)) return { embedding: null, cached: false }

  // Store in cache
  setCachedEmbedding(normalizedQuery, embedding)

  return { embedding, cached: false }
}

// ---------------------------------------------------------------------------
// Main search handler
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const searchStartMs = Date.now()

  try {
    const supabase = await createClient()
    const { searchParams } = request.nextUrl

    const params: SearchParams = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      priceMin: searchParams.get('priceMin')
        ? parseFloat(searchParams.get('priceMin')!)
        : undefined,
      priceMax: searchParams.get('priceMax')
        ? parseFloat(searchParams.get('priceMax')!)
        : undefined,
      department: searchParams.get('department') || undefined,
      condition: searchParams.get('condition') || undefined,
      sellerType: (searchParams.get('sellerType') as SearchParams['sellerType']) || undefined,
      status: searchParams.get('status') || 'active',
      sort: (searchParams.get('sort') as SearchParams['sort']) || 'relevance',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24,
    }

    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 24))
    const offset = (page - 1) * limit

    const rpcParams = {
      search_query: params.q || null,
      category_filter: params.category || null,
      price_min: params.priceMin || null,
      price_max: params.priceMax || null,
      location_department_filter: params.department || null,
      condition_filter: params.condition || null,
      status_filter: params.status || null,
      seller_type_filter: params.sellerType || null,
      sort_by: params.sort || 'relevance',
      result_limit: limit,
      result_offset: offset,
    }

    const semanticEnabled = await isSemanticSearchEnabled(supabase)
    const useHybrid = semanticEnabled && (params.q?.trim()?.length ?? 0) > 0

    let data: { products: unknown[]; total_count: number }[] | null
    let error: { message: string } | null = null
    let searchMode: 'hybrid' | 'keyword' = 'keyword'
    let embeddingCached = false

    if (useHybrid) {
      const embeddingStartMs = Date.now()
      const { embedding, cached } = await getQueryEmbedding(params.q!.trim())
      const embeddingMs = Date.now() - embeddingStartMs
      embeddingCached = cached

      if (process.env.NODE_ENV === 'development') {
        console.log(`[search] embedding: ${embeddingMs}ms (${cached ? 'cached' : 'api'})`)
      }

      if (embedding) {
        searchMode = 'hybrid'
        const result = await supabase.rpc('search_products_semantic', {
          ...rpcParams,
          query_embedding: embedding,
        })
        if (result.error) {
          console.warn(
            'search_products_semantic failed, falling back to keyword:',
            result.error.message
          )
          searchMode = 'keyword'
          const fallback = await supabase.rpc('search_products', rpcParams)
          data = fallback.data
          error = fallback.error
        } else {
          data = result.data
          error = null
        }
      } else {
        const result = await supabase.rpc('search_products', rpcParams)
        data = result.data
        error = result.error
      }
    } else {
      const result = await supabase.rpc('search_products', rpcParams)
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Search RPC error:', error)
      return NextResponse.json(
        { error: 'Error al buscar productos', details: error.message },
        { status: 500 }
      )
    }

    const result = data?.[0] || { products: [], total_count: 0 }
    const products = result.products || []
    const totalCount = result.total_count || 0
    const totalMs = Date.now() - searchStartMs

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[search] mode=${searchMode} q="${params.q || ''}" results=${totalCount} total=${totalMs}ms`
      )
    }

    return NextResponse.json({
      products,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: offset + products.length < totalCount,
      searchMode,
      embeddingCached,
      latencyMs: totalMs,
    })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
