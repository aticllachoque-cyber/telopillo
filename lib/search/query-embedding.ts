import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchWithPolicy } from '@/lib/network/fetch'

/**
 * Shared semantic-search plumbing for the /api/search* routes.
 * Extracted from app/api/search/route.ts so businesses / profiles search
 * runs the same hybrid pipeline (feature flag + query embedding + cache).
 */

type AppSupabaseClient = SupabaseClient

// ---------------------------------------------------------------------------
// Feature flag: semantic search enabled (app_config, env override)
// ---------------------------------------------------------------------------
export async function isSemanticSearchEnabled(supabase: AppSupabaseClient): Promise<boolean> {
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
// Query embedding cache (in-memory, TTL-based, shared across search routes)
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
// Get query embedding (with cache). Returns null on any failure — callers
// must fall back to keyword-only search.
// ---------------------------------------------------------------------------
export async function getQueryEmbedding(
  text: string,
  context = 'search'
): Promise<{ embedding: number[] | null; cached: boolean }> {
  const normalizedQuery = text.toLowerCase().trim()

  // Check cache first
  const cached = getCachedEmbedding(normalizedQuery)
  if (cached) {
    return { embedding: cached, cached: true }
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`
    const res = await fetchWithPolicy(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      timeoutMs: 6_000,
      retries: 1,
    })

    if (!res.ok) return { embedding: null, cached: false }

    const { embedding } = await res.json()
    if (!Array.isArray(embedding)) return { embedding: null, cached: false }

    setCachedEmbedding(normalizedQuery, embedding)
    return { embedding, cached: false }
  } catch (error) {
    console.warn(`generate-embedding failed for ${context}:`, error)
    return { embedding: null, cached: false }
  }
}
