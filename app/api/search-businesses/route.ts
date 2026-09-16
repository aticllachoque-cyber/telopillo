// Public route: business search does not require authentication.
// Hybrid keyword + semantic when the semantic_search_enabled flag is on
// (business_profiles.embedding from name+category+description). No phone
// enrichment.
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'
import { expandQuery } from '@/lib/search/synonyms'
import { getQueryEmbedding, isSemanticSearchEnabled } from '@/lib/search/query-embedding'
import type { SearchBusiness } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startMs = Date.now()
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() || undefined
  const category = searchParams.get('category') || undefined
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
      const { embedding, cached } = await getQueryEmbedding(q, 'business search')
      embeddingCached = cached
      if (embedding) {
        queryEmbedding = embedding
        searchMode = 'hybrid'
      } else {
        console.warn(JSON.stringify({ event: 'embedding_failure', type: 'businesses', query: q }))
      }
    }

    // Pass expanded FTS query in search_query. SQL detects tsquery format
    // (contains " | " or " & ") and uses to_tsquery.
    const searchQueryForRpc = q ? (expandQuery(q) ?? q) : null

    const { data, error } = await supabase.rpc('search_businesses', {
      search_query: searchQueryForRpc,
      query_embedding: queryEmbedding,
      category_filter: category || null,
      location_department_filter: department || null,
      sort_by: sort,
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      console.error('[search-businesses] RPC error:', error)
      return NextResponse.json({ error: 'Error al buscar negocios' }, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data
    const businesses = (row?.businesses ?? []) as SearchBusiness[]
    const totalCount = row?.total_count ?? 0
    const totalMs = Date.now() - startMs

    console.log(
      JSON.stringify({
        event: 'search',
        type: 'businesses',
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
      businesses,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
      searchMode,
      latencyMs: totalMs,
    })
  } catch (err) {
    console.error('[search-businesses] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
