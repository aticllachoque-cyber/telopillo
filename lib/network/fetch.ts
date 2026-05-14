import { isAbortLikeError } from '@/lib/utils'

const DEFAULT_RETRYABLE_STATUSES = [408, 425, 429, 500, 502, 503, 504]

export class TimeoutError extends Error {
  constructor(message = 'La solicitud tardó demasiado en responder.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export interface FetchWithPolicyOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
  retryOnStatuses?: number[]
}

export function isRetryableResponseStatus(status: number): boolean {
  return DEFAULT_RETRYABLE_STATUSES.includes(status)
}

export function isRecoverableNetworkError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true
  if (isAbortLikeError(error)) return false
  if (error instanceof TypeError) return true
  if (!(error instanceof Error)) return false

  const lower = error.message.toLowerCase()
  return (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('load failed') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnreset') ||
    lower.includes('enotfound') ||
    lower.includes('eai_again') ||
    lower.includes('socket hang up')
  )
}

export function getNetworkErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TimeoutError) {
    return 'La conexión está lenta. Intenta de nuevo en unos segundos.'
  }

  if (isRecoverableNetworkError(error)) {
    return 'No pudimos conectarnos en este momento. Revisa tu internet e intenta de nuevo.'
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

export async function fetchWithPolicy(
  input: RequestInfo | URL,
  options: FetchWithPolicyOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 8_000,
    retries = 1,
    retryDelayMs = 400,
    retryOnStatuses = DEFAULT_RETRYABLE_STATUSES,
    signal,
    ...init
  } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    const timeoutController = new AbortController()
    const combinedSignal = combineAbortSignals(signal, timeoutController.signal)
    let didTimeout = false
    const timeoutId =
      timeoutMs > 0
        ? setTimeout(() => {
            didTimeout = true
            timeoutController.abort()
          }, timeoutMs)
        : undefined

    try {
      const response = await fetch(input, { ...init, signal: combinedSignal })

      if (response.ok || !retryOnStatuses.includes(response.status) || attempt === retries) {
        return response
      }

      await cancelResponseBody(response)
    } catch (error) {
      const normalizedError =
        didTimeout ||
        (isAbortLikeError(error) && timeoutController.signal.aborted && !signal?.aborted)
          ? new TimeoutError()
          : error

      if (attempt === retries || signal?.aborted || !isRecoverableNetworkError(normalizedError)) {
        throw normalizedError
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }

    await delay(retryDelayMs * (attempt + 1))
  }

  throw new Error('La solicitud falló después de varios intentos.')
}

function combineAbortSignals(
  ...signals: Array<AbortSignal | null | undefined>
): AbortSignal | undefined {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal))
  if (activeSignals.length === 0) return undefined

  const controller = new AbortController()
  const abort = () => {
    controller.abort()
    for (const activeSignal of activeSignals) {
      activeSignal.removeEventListener('abort', abort)
    }
  }

  for (const activeSignal of activeSignals) {
    if (activeSignal.aborted) {
      abort()
      return controller.signal
    }
    activeSignal.addEventListener('abort', abort, { once: true })
  }

  return controller.signal
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function cancelResponseBody(response: Response): Promise<void> {
  const stream = response.body
  if (!stream) return

  try {
    await stream.cancel()
  } catch {
    // Ignore drain errors from retryable responses.
  }
}
