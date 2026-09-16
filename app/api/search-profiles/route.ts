// Public route: seller-profile search does not require authentication.
// Hybrid keyword + semantic when the semantic_search_enabled flag is on
// (profiles.embedding comes from full_name + owning business context) and
// phone-free by design: the search_profiles RPC projects profiles_public
// fields only (TELO-003) and is restricted to profiles with at least one
// active listing.
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'
import { expandQuery } from '@/lib/search/synonyms'
import { getQueryEmbedding, isSemanticSearchEnabled } from '@/lib/search/query-embedding'
import type { SearchPerson } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startMs = Date.now()
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() || undefined
  const department = searchParams.get('department') || undefined
  const sort = searchParams.get('sort') === 'newest' ? 'newest' : 'relevance'
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
  const offset = (page - 1) * limit

  try {
    const supabase = createPublicClient()

    // Semantic: only when flag on and there is a query (same gate as products)
    const semanticEnabled = await isSemanticSearchEnabled(supabase)
    const useHybrid = semanticEnabled && (q?.length ?? 0) > 0

    let searchMode: 'hybrid' | 'keyword' | 'browse' = q ? 'keyword' : 'browse'
    let embeddingCached = false
    let queryEmbedding: number[] | null = null
    if (useHybrid && q) {
      const { embedding, cached } = await getQueryEmbedding(q, 'profile search')
      embeddingCached = cached
      if (embedding) {
        queryEmbedding = embedding
        searchMode = 'hybrid'
      } else {
        console.warn(JSON.stringify({ event: 'embedding_failure', type: 'profiles', query: q }))
      }
    }

    // Pass expanded FTS query in search_query. SQL detects tsquery format
    // (contains " | " or " & ") and uses to_tsquery.
    const searchQueryForRpc = q ? (expandQuery(q) ?? q) : null

    const { data, error } = await supabase.rpc('search_profiles', {
      search_query: searchQueryForRpc,
      query_embedding: queryEmbedding,
      location_department_filter: department || null,
      sort_by: sort,
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      console.error('[search-profiles] RPC error:', error)
      return NextResponse.json({ error: 'Error al buscar vendedores' }, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data
    const profiles = (row?.profiles ?? []) as SearchPerson[]
    const totalCount = row?.total_count ?? 0
    const totalMs = Date.now() - startMs

    console.log(
      JSON.stringify({
        event: 'search',
        type: 'profiles',
        query: q ?? null,
        mode: searchMode,
        embeddingCached,
        embeddingFailed: searchMode === 'keyword' && semanticEnabled && !!q,
        results: totalCount,
        latencyMs: totalMs,
        zeroResults: totalCount === 0 && !!q,
      })
    )

    return NextResponse.json({
      profiles,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
      searchMode,
      latencyMs: totalMs,
    })
  } catch (err) {
    console.error('[search-profiles] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
