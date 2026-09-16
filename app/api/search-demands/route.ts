// Public route: demand search does not require authentication
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'
import {
  enrichDemandSearchRows,
  fetchSellerContactPhonesByUserId,
} from '@/lib/search/enrichSearchContacts'
import { expandQuery } from '@/lib/search/synonyms'
import { getQueryEmbedding, isSemanticSearchEnabled } from '@/lib/search/query-embedding'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startMs = Date.now()
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category') || undefined
  const department = searchParams.get('department') || undefined
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest')
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
  const offset = (page - 1) * limit

  try {
    const supabase = createPublicClient()

    let searchMode = 'browse'
    let embeddingCached = false
    let queryEmbedding: number[] | null = null

    let semanticEnabled = false

    if (q) {
      searchMode = 'keyword'
      // Tab counters on /buscar fetch limit=1 and only read total_count;
      // skip the embedding call there — keyword-only total_count is exact
      // while the hybrid count is capped at the RRF union of top matches.
      if (limit > 1) {
        semanticEnabled = await isSemanticSearchEnabled(supabase)
      }

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
      return NextResponse.json({ error: 'Error al buscar solicitudes' }, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data
    const rawDemands = (row?.demands ?? []) as Array<{ user_id?: string }>
    const contactByUserId = await fetchSellerContactPhonesByUserId(
      supabase,
      rawDemands.map((demand) => demand.user_id).filter(Boolean) as string[]
    )
    const demands = enrichDemandSearchRows(rawDemands, contactByUserId)
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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
