const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PUBLIC_ROUTE_SEPARATOR = '--'
const MAX_SLUG_LENGTH = 60
const MAX_SLUG_WORDS = 8

function encodeBigIntBase62(value: bigint): string {
  if (value === 0n) return BASE62_ALPHABET.charAt(0)

  const base = BigInt(BASE62_ALPHABET.length)
  let current = value
  let encoded = ''

  while (current > 0n) {
    const remainder = Number(current % base)
    encoded = BASE62_ALPHABET[remainder] + encoded
    current /= base
  }

  return encoded
}

function decodeBase62BigInt(value: string): bigint | null {
  if (!value) return null

  const base = BigInt(BASE62_ALPHABET.length)
  let decoded = 0n

  for (const char of value) {
    const index = BASE62_ALPHABET.indexOf(char)
    if (index === -1) return null
    decoded = decoded * base + BigInt(index)
  }

  return decoded
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export function encodeUuidToPublicToken(uuid: string): string {
  if (!isUuid(uuid)) return uuid
  const hex = uuid.replace(/-/g, '')
  return encodeBigIntBase62(BigInt(`0x${hex}`))
}

export function decodePublicTokenToUuid(token: string): string | null {
  const decoded = decodeBase62BigInt(token)
  if (decoded == null) return null

  const hex = decoded.toString(16).padStart(32, '0')
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`

  return isUuid(uuid) ? uuid : null
}

function extractPublicToken(value: string): string {
  const [token] = value.split(PUBLIC_ROUTE_SEPARATOR)
  return token || value
}

export function slugifyTitle(title: string): string {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!normalized) return ''

  const limitedWords = normalized.split('-').filter(Boolean).slice(0, MAX_SLUG_WORDS).join('-')
  return limitedWords.slice(0, MAX_SLUG_LENGTH).replace(/-$/g, '')
}

function buildPublicRouteSegment(id: string, title?: string): string {
  const token = encodeUuidToPublicToken(id)
  const slug = title ? slugifyTitle(title) : ''
  return slug ? `${token}${PUBLIC_ROUTE_SEPARATOR}${slug}` : token
}

export function resolveUuidFromRouteParam(value: string): string | null {
  if (!value) return null
  const token = extractPublicToken(value)
  if (isUuid(token)) return token
  return decodePublicTokenToUuid(token)
}

export function getProductPath(id: string, title?: string): string {
  return `/productos/${buildPublicRouteSegment(id, title)}`
}

export function getProductEditPath(id: string, title?: string): string {
  return `${getProductPath(id, title)}/editar`
}

export function getDemandPath(id: string, title?: string): string {
  return `/busco/${buildPublicRouteSegment(id, title)}`
}

export function getDemandEditPath(id: string, title?: string): string {
  return `${getDemandPath(id, title)}/editar`
}
