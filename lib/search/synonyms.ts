/**
 * Bolivian Spanish synonym expansion for marketplace search.
 *
 * Expands user queries with local synonyms so FTS matches documents
 * using alternative terms (e.g. "telefono" matches "celular").
 *
 * Returns a tsquery-compatible string with OR groups joined by AND:
 *   "celular samsung" -> "( celular | telefono | smartphone | movil ) & samsung"
 */

const SYNONYM_GROUPS: string[][] = [
  ['telefono', 'celular', 'smartphone', 'movil', 'fono'],
  ['computadora', 'laptop', 'notebook', 'compu', 'portatil', 'pc'],
  ['television', 'televisor', 'tv', 'tele', 'pantalla'],
  ['auto', 'carro', 'vehiculo', 'coche', 'automovil'],
  ['moto', 'motocicleta', 'motoneta', 'scooter'],
  ['bicicleta', 'bici', 'cicla'],
  ['departamento', 'depa', 'apartamento', 'piso'],
  ['casa', 'vivienda', 'inmueble', 'propiedad'],
  ['chompa', 'sudadera', 'buzo', 'hoodie', 'polera'],
  ['zapatillas', 'zapatos', 'tenis', 'calzado', 'sneakers'],
  ['ropa', 'vestimenta', 'prenda', 'indumentaria'],
  ['camisa', 'blusa', 'polo', 'playera'],
  ['pantalon', 'jean', 'jeans', 'vaquero'],
  ['refrigerador', 'refrigeradora', 'heladera', 'nevera', 'refri'],
  ['cocina', 'estufa', 'horno', 'fogon'],
  ['lavadora', 'lavarropas'],
  ['audifonos', 'auriculares', 'headphones', 'earbuds'],
  ['tablet', 'tableta', 'ipad'],
  ['impresora', 'printer'],
  ['mueble', 'muebles', 'mobiliario'],
  ['sofa', 'sillon', 'couch'],
  ['cama', 'litera', 'camarote'],
  ['trabajo', 'empleo', 'chamba', 'pega'],
  ['barato', 'economico', 'oferta', 'ganga'],
  ['nuevo', 'sin uso', 'sellado'],
  ['usado', 'segunda mano', 'seminuevo'],
]

const WORD_TO_GROUP = new Map<string, string[]>()

for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const normalized = word.toLowerCase().trim()
    WORD_TO_GROUP.set(normalized, group)
  }
}

function sanitizeTsqueryToken(token: string): string {
  return token.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '')
}

/**
 * Build a tsquery-compatible string with synonym expansion.
 *
 * Each input word is expanded to its synonym group (OR),
 * and word groups are joined with AND.
 *
 * @example
 *   expandQuery("telefono") => "telefono | celular | smartphone | movil | fono"
 *   expandQuery("celular samsung") => "( celular | telefono | smartphone | movil | fono ) & samsung"
 *   expandQuery("iphone") => "iphone"
 */
export function expandQuery(query: string): string | null {
  const words = query.toLowerCase().trim().split(/\s+/).map(sanitizeTsqueryToken).filter(Boolean)

  if (words.length === 0) return null

  const seen = new Set<string>()
  const groups: string[] = []

  for (const word of words) {
    if (seen.has(word)) continue
    seen.add(word)

    const synonyms = WORD_TO_GROUP.get(word)
    if (synonyms && synonyms.length > 1) {
      const expanded = synonyms.map(sanitizeTsqueryToken).filter(Boolean).join(' | ')
      groups.push(words.length > 1 ? `( ${expanded} )` : expanded)
    } else {
      groups.push(word)
    }
  }

  return groups.join(' & ')
}
