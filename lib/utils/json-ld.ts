/**
 * Serializes JSON-LD for safe embedding in a <script type="application/ld+json"> tag.
 * JSON.stringify alone does not escape <, >, or &, which can break out of the script
 * block and enable XSS when user-controlled fields are included in the payload.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
