import assert from 'node:assert/strict'
import { test } from 'node:test'

class TimeoutError extends Error {
  constructor(message = 'La solicitud tardó demasiado en responder.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError'
}

function isAbortLikeError(error) {
  if (isAbortError(error)) return true
  if (typeof error !== 'object' || error === null) return false
  const record = error
  if (typeof record.name === 'string' && record.name === 'AbortError') return true
  if (typeof record.message === 'string' && record.message.includes('AbortError')) return true
  return false
}

function isRetryableResponseStatus(status) {
  return [408, 425, 429, 500, 502, 503, 504].includes(status)
}

function isRecoverableNetworkError(error) {
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

function getNetworkErrorMessage(error, fallback) {
  if (error instanceof TimeoutError) {
    return 'La conexión está lenta. Intenta de nuevo en unos segundos.'
  }

  if (isRecoverableNetworkError(error)) {
    return 'No pudimos conectarnos en este momento. Revisa tu internet e intenta de nuevo.'
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

test('retryable statuses stay limited to transient failures', () => {
  assert.equal(isRetryableResponseStatus(408), true)
  assert.equal(isRetryableResponseStatus(429), true)
  assert.equal(isRetryableResponseStatus(503), true)
  assert.equal(isRetryableResponseStatus(404), false)
})

test('recoverable network errors exclude explicit aborts', () => {
  const abortError = new Error('signal is aborted without reason')
  abortError.name = 'AbortError'

  assert.equal(isRecoverableNetworkError(new TimeoutError()), true)
  assert.equal(isRecoverableNetworkError(new TypeError('Failed to fetch')), true)
  assert.equal(isRecoverableNetworkError(abortError), false)
})

test('network messages stay user-friendly in Spanish', () => {
  assert.equal(
    getNetworkErrorMessage(new TimeoutError(), 'fallback'),
    'La conexión está lenta. Intenta de nuevo en unos segundos.'
  )
  assert.equal(
    getNetworkErrorMessage(new TypeError('Failed to fetch'), 'fallback'),
    'No pudimos conectarnos en este momento. Revisa tu internet e intenta de nuevo.'
  )
  assert.equal(getNetworkErrorMessage(new Error('otro error'), 'fallback'), 'otro error')
})
