import assert from 'node:assert/strict'
import { test } from 'node:test'

// Mirrors lib/utils/date.ts (unit tests run on plain Node without a TS loader).
const DAY_MS = 24 * 60 * 60 * 1000
function formatPublishedLabel(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  }
  return date.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

const now = new Date('2026-09-18T12:00:00Z')
const daysAgo = (n) => new Date(now.getTime() - n * DAY_MS)

test('formatPublishedLabel: relative labels', () => {
  assert.equal(formatPublishedLabel(now, now), 'hoy')
  assert.equal(formatPublishedLabel(daysAgo(0.5), now), 'hoy')
  assert.equal(formatPublishedLabel(daysAgo(1), now), 'ayer')
  assert.equal(formatPublishedLabel(daysAgo(3), now), 'hace 3 días')
  assert.equal(formatPublishedLabel(daysAgo(7), now), 'hace 1 semana')
  assert.equal(formatPublishedLabel(daysAgo(20), now), 'hace 2 semanas')
})

test('formatPublishedLabel: absolute date after 30 days, year only when different', () => {
  assert.match(formatPublishedLabel(daysAgo(45), now), /^4 ago/)
  assert.doesNotMatch(formatPublishedLabel(daysAgo(45), now), /2026/)
  assert.match(formatPublishedLabel(new Date('2025-03-02T12:00:00Z'), now), /2025/)
})

test('formatPublishedLabel: invalid input', () => {
  assert.equal(formatPublishedLabel('not-a-date', now), '')
})
