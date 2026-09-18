const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Short, human-friendly "published" label for listing cards (es-BO).
 * Recent dates read as relative time ("hoy", "ayer", "hace 3 días"); older
 * ones fall back to an absolute date so the label never becomes vague
 * ("hace 7 meses"). Accepts an ISO string or Date; returns '' when invalid.
 */
export function formatPublishedLabel(value: string | Date, now: Date = new Date()): string {
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

/** Full date for tooltips / accessible labels, e.g. "18 de septiembre de 2026". */
export function formatFullDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}
