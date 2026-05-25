import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['project_stage']
type Tipo = Database['public']['Enums']['property_type']

const STAGES: readonly Stage[] = [
  'lanzamiento',
  'preventa',
  'construccion',
  'entrega_inmediata',
] as const

const TIPOS: readonly Tipo[] = ['apartamento', 'casa'] as const

export interface Filters {
  tipo: Tipo | null
  departamento: string | null
  municipio: string | null
  zonas: string[]
  precio_min: number | null
  precio_max: number | null
  etapa: Stage | null
  dormitorios: number[]
  q: string | null
}

export const EMPTY_FILTERS: Filters = {
  tipo: null,
  departamento: null,
  municipio: null,
  zonas: [],
  precio_min: null,
  precio_max: null,
  etapa: null,
  dormitorios: [],
  q: null,
}

export type FilterParams = Record<string, string | string[] | undefined>

function pickString(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === 'string' && raw.trim().length > 0) return raw
  return null
}

function pickNumber(raw: string | string[] | undefined): number | null {
  const s = pickString(raw)
  if (s === null) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function pickEnum<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const s = pickString(raw)
  if (s === null) return null
  return (allowed as readonly string[]).includes(s) ? (s as T) : null
}

function pickInt(raw: string | string[] | undefined): number | null {
  const n = pickNumber(raw)
  if (n === null) return null
  return Number.isInteger(n) ? n : null
}

function pickStringArray(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((s) => s.trim().length > 0)
  return raw.trim().length > 0 ? [raw] : []
}

function pickIntArray(raw: string | string[] | undefined): number[] {
  return pickStringArray(raw)
    .map((s) => {
      const n = Number(s)
      return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null
    })
    .filter((n): n is number => n !== null)
}

export function parseFilters(raw: FilterParams): Filters {
  return {
    tipo: pickEnum(raw.tipo, TIPOS),
    departamento: pickString(raw.departamento),
    municipio: pickString(raw.municipio),
    zonas: pickStringArray(raw.zona),
    precio_min: pickNumber(raw.precio_min),
    precio_max: pickNumber(raw.precio_max),
    etapa: pickEnum(raw.etapa, STAGES),
    dormitorios: pickIntArray(raw.dormitorios),
    q: pickString(raw.q),
  }
}

export function hasAnyFilter(f: Filters): boolean {
  return (
    f.tipo !== null ||
    f.departamento !== null ||
    f.municipio !== null ||
    f.zonas.length > 0 ||
    f.precio_min !== null ||
    f.precio_max !== null ||
    f.etapa !== null ||
    f.dormitorios.length > 0 ||
    f.q !== null
  )
}
