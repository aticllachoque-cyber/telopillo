export interface SearchCacheEnvelope<T> {
  version: number
  updatedAt: string
  data: T
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function buildSearchCacheKey(namespace: string, params: string): string {
  return `cache:${namespace}:${params || '__default__'}`
}

export function saveSearchCache<T>(key: string, data: T, version = 1): boolean {
  if (!isBrowser()) return false

  try {
    const payload: SearchCacheEnvelope<T> = {
      version,
      updatedAt: new Date().toISOString(),
      data,
    }

    window.localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('[search-cache] Failed to save cache', { key, error })
    return false
  }
}

export function loadSearchCache<T>(key: string, version = 1): SearchCacheEnvelope<T> | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as SearchCacheEnvelope<T>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== version) return null
    if (!('data' in parsed)) return null

    return parsed
  } catch (error) {
    console.error('[search-cache] Failed to load cache', { key, error })
    return null
  }
}
