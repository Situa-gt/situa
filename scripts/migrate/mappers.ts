// TipoProyectos IDs confirmed from Bubble API
const TIPO_APARTAMENTO = '1751496854908x135689154954536030'
const TIPO_CASA = '1751496858559x208754744226590460'

export function mapPropertyType(bubbleTipoId: string): 'apartamento' | 'casa' {
  return bubbleTipoId === TIPO_CASA ? 'casa' : 'apartamento'
}

export function mapStage(
  raw: string,
): 'lanzamiento' | 'preventa' | 'construccion' | 'entrega_inmediata' {
  const s = (raw ?? '').toLowerCase().trim()
  if (s === 'preventa') return 'preventa'
  if (s.startsWith('construc')) return 'construccion'
  if (s.includes('entrega')) return 'entrega_inmediata'
  if (s === 'lanzamiento') return 'lanzamiento'
  // "Planificación" and unknowns → lanzamiento (earliest stage)
  if (s !== '') console.warn(`  ⚠  Unknown stage "${raw}" → lanzamiento`)
  return 'lanzamiento'
}

export function mapCurrency(raw: string): 'USD' | 'GTQ' {
  const c = (raw ?? '').toLowerCase()
  return c === 'quetzal' || c === 'gtq' ? 'GTQ' : 'USD'
}

export function mapProjectStatus(raw: string): boolean {
  return (raw ?? '').toLowerCase() === 'publicado'
}

export function bubbleImageUrl(raw: string | undefined | null): string | null {
  if (!raw) return null
  return raw.startsWith('//') ? `https:${raw}` : raw
}
