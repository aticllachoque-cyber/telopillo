const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export function resolveUuidFromRouteParam(value: string): string | null {
  if (!value) return null
  if (isUuid(value)) return value
  return decodePublicTokenToUuid(value)
}

export function getProductPath(id: string): string {
  return `/productos/${encodeUuidToPublicToken(id)}`
}

export function getProductEditPath(id: string): string {
  return `${getProductPath(id)}/editar`
}

export function getDemandPath(id: string): string {
  return `/busco/${encodeUuidToPublicToken(id)}`
}

export function getDemandEditPath(id: string): string {
  return `${getDemandPath(id)}/editar`
}
