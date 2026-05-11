export interface DraftEnvelope<T> {
  version: number
  updatedAt: string
  data: T
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function saveDraft<T>(key: string, data: T, version = 1): boolean {
  if (!isBrowser()) return false

  try {
    const payload: DraftEnvelope<T> = {
      version,
      updatedAt: new Date().toISOString(),
      data,
    }

    window.localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('[drafts] Failed to save draft', { key, error })
    return false
  }
}

export function loadDraft<T>(key: string, version = 1): DraftEnvelope<T> | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as DraftEnvelope<T>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== version) return null
    if (!('data' in parsed)) return null

    return parsed
  } catch (error) {
    console.error('[drafts] Failed to load draft', { key, error })
    return null
  }
}

export function clearDraft(key: string): boolean {
  if (!isBrowser()) return false

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('[drafts] Failed to clear draft', { key, error })
    return false
  }
}
