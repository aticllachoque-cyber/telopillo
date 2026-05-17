export interface ReadCacheEnvelope<T> {
  version: number
  updatedAt: string
  data: T
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function buildReadCacheKey(namespace: string, identifier: string): string {
  return `cache:${namespace}:${identifier || '__default__'}`
}

export function saveReadCache<T>(key: string, data: T, version = 1): boolean {
  if (!isBrowser()) return false

  try {
    const payload: ReadCacheEnvelope<T> = {
      version,
      updatedAt: new Date().toISOString(),
      data,
    }

    window.localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('[read-cache] Failed to save cache', { key, error })
    return false
  }
}

export function loadReadCache<T>(key: string, version = 1): ReadCacheEnvelope<T> | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as ReadCacheEnvelope<T>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== version) return null
    if (!('data' in parsed)) return null

    return parsed
  } catch (error) {
    console.error('[read-cache] Failed to load cache', { key, error })
    return null
  }
}

export function clearReadCache(key: string): boolean {
  if (!isBrowser()) return false

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('[read-cache] Failed to clear cache', { key, error })
    return false
  }
}
