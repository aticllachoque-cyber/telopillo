/**
 * Node smoke tests for abort helpers (`npm run test:unit`).
 * Logic mirrors `isAbortLikeError` in `lib/utils.ts` — update both if behavior changes.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError'
}

function isAbortLikeError(error) {
  if (isAbortError(error)) return true
  if (typeof error !== 'object' || error === null) return false
  const rec = error
  if (typeof rec.name === 'string' && rec.name === 'AbortError') return true
  if (typeof rec.message === 'string' && rec.message.includes('AbortError')) return true
  return false
}

test('isAbortLikeError matches thrown AbortError', () => {
  const err = new Error('signal is aborted without reason')
  err.name = 'AbortError'
  assert.equal(isAbortLikeError(err), true)
})

test('isAbortLikeError matches PostgREST-style message', () => {
  assert.equal(
    isAbortLikeError({ message: 'AbortError: signal is aborted without reason', code: '' }),
    true
  )
})

test('isAbortLikeError rejects unrelated errors', () => {
  assert.equal(isAbortLikeError(new Error('network')), false)
  assert.equal(isAbortLikeError(null), false)
})
