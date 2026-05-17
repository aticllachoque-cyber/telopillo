export interface UploadRecoveryDraft {
  version: number
  updatedAt: string
  data: {
    bucket: string
    failedCount: number
    message: string
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function buildUploadRecoveryKey(scope: string): string {
  return `upload-recovery:${scope}`
}

export function saveUploadRecovery(key: string, data: UploadRecoveryDraft['data']): boolean {
  if (!isBrowser()) return false

  try {
    const payload: UploadRecoveryDraft = {
      version: 1,
      updatedAt: new Date().toISOString(),
      data,
    }

    window.localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('[upload-recovery] Failed to save recovery state', { key, error })
    return false
  }
}

export function loadUploadRecovery(key: string): UploadRecoveryDraft | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as UploadRecoveryDraft
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== 1) return null
    if (!parsed.data || typeof parsed.data !== 'object') return null

    return parsed
  } catch (error) {
    console.error('[upload-recovery] Failed to load recovery state', { key, error })
    return null
  }
}

export function clearUploadRecovery(key: string): boolean {
  if (!isBrowser()) return false

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('[upload-recovery] Failed to clear recovery state', { key, error })
    return false
  }
}
