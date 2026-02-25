// Public route: demand search does not require authentication
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expandQuery } from '@/lib/search/synonyms'

export const dynamic = 'force-dynamic'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

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

interface EmbeddingCacheEntry {
  embedding: number[]
  expiresAt: number
}

const EMBEDDING_CACHE = new Map<string, EmbeddingCacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000
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
  if (EMBEDDING_CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = EMBEDDING_CACHE.keys().next().value
    if (firstKey) EMBEDDING_CACHE.delete(firstKey)
  }
  EMBEDDING_CACHE.set(query, {
    embedding,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

async function getQueryEmbedding(
  text: string
): Promise<{ embedding: number[] | null; cached: boolean }> {
  const normalizedQuery = text.toLowerCase().trim()

  const cached = getCachedEmbedding(normalizedQuery)
  if (cached) return { embedding: cached, cached: true }

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

  setCachedEmbedding(normalizedQuery, embedding)
  return { embedding, cached: false }
}

export async function GET(request: NextRequest) {
  const startMs = Date.now()
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category') || undefined
  const department = searchParams.get('department') || undefined
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    let searchMode = 'browse'
    let embeddingCached = false
    let queryEmbedding: number[] | null = null

    let semanticEnabled = false

    if (q) {
      searchMode = 'keyword'
      semanticEnabled = await isSemanticSearchEnabled(supabase)

      if (semanticEnabled) {
        const { embedding, cached } = await getQueryEmbedding(q)
        embeddingCached = cached
        if (embedding) {
          queryEmbedding = embedding
          searchMode = 'hybrid'
        } else {
          console.warn(
            JSON.stringify({
              event: 'embedding_failure',
              type: 'demands',
              query: q,
              reason: 'hf_api_error',
            })
          )
        }
      }
    }

    // Pass expanded FTS query in search_query (PostgREST ignores fts_query param).
    // SQL detects tsquery format (contains " | " or " & ") and uses to_tsquery.
    const searchQueryForRpc = q ? (expandQuery(q) ?? q) : null

    const rpcParams: Record<string, unknown> = {
      search_query: searchQueryForRpc,
      query_embedding: queryEmbedding ?? null,
      category_filter: category || null,
      department_filter: department || null,
      sort_by: sort,
      result_limit: limit,
      result_offset: offset,
    }

    const { data, error } = await supabase.rpc('search_demands_hybrid', rpcParams)

    if (error) {
      console.error('[search-demands] RPC error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data
    const demands = row?.demands ?? []
    const totalCount = row?.total_count ?? 0
    const totalMs = Date.now() - startMs

    console.log(
      JSON.stringify({
        event: 'search',
        type: 'demands',
        query: q ?? null,
        mode: searchMode,
        results: totalCount,
        latencyMs: totalMs,
        embeddingCached,
        embeddingFailed: searchMode === 'keyword' && semanticEnabled && !!q,
        zeroResults: totalCount === 0 && !!q,
      })
    )

    return NextResponse.json({
      demands,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
      searchMode,
      embeddingCached,
      latencyMs: totalMs,
    })
  } catch (err) {
    console.error('[search-demands] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
