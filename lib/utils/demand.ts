const PLACEHOLDER_PATTERNS = [
  /publica lo que buscas/i,
  /public[áa] lo que busc[áa]s/i,
  /describe lo que necesitas/i,
  /describ[íi] lo que necesit[áa]s/i,
  /descripci[óo]n de lo que busc[áa]s/i,
  /los vendedores te contactar[áa]n/i,
]

export function isPlaceholderDescription(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text))
}
