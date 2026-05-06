import type { Database } from '@/lib/database.types'

export type PropertyType = Database['public']['Enums']['property_type']
export type TipoSlug = 'apartamentos' | 'casas'

const TIPO_TO_SLUG: Record<PropertyType, TipoSlug> = {
  apartamento: 'apartamentos',
  casa: 'casas',
}

const SLUG_TO_TIPO: Record<TipoSlug, PropertyType> = {
  apartamentos: 'apartamento',
  casas: 'casa',
}

export function tipoSlug(tipo: PropertyType): TipoSlug {
  return TIPO_TO_SLUG[tipo]
}

export function tipoFromSlug(slug: string): PropertyType | null {
  return slug in SLUG_TO_TIPO ? SLUG_TO_TIPO[slug as TipoSlug] : null
}
