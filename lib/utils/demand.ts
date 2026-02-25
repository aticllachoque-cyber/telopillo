const PLACEHOLDER_PATTERNS = [
  /publica lo que buscas/i,
  /describe lo que necesitas/i,
  /los vendedores te contactar[áa]n/i,
]

export function isPlaceholderDescription(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text))
}
