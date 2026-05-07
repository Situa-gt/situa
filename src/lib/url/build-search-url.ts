import { tipoSlug } from '@/lib/types/property'
import type { Filters } from '@/lib/filters/parse'

const ROUTING_KEYS: readonly (keyof Filters)[] = ['tipo', 'zona']

function appendNonRouting(params: URLSearchParams, f: Filters) {
  for (const [key, value] of Object.entries(f) as Array<[keyof Filters, Filters[keyof Filters]]>) {
    if (ROUTING_KEYS.includes(key)) continue
    if (value === null) continue
    params.set(key, String(value))
  }
}

function withQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs.length > 0 ? `${path}?${qs}` : path
}

export function buildSearchUrl(f: Filters): string {
  const remaining = new URLSearchParams()
  appendNonRouting(remaining, f)

  if (f.zona && f.tipo) {
    return withQuery(`/${f.zona}/${tipoSlug(f.tipo)}`, remaining)
  }
  if (f.zona) {
    return withQuery(`/${f.zona}`, remaining)
  }
  if (f.tipo) {
    return withQuery(`/${tipoSlug(f.tipo)}`, remaining)
  }

  const all = new URLSearchParams()
  if (f.tipo) all.set('tipo', f.tipo)
  if (f.zona) all.set('zona', f.zona)
  appendNonRouting(all, f)
  const qs = all.toString()
  return qs.length > 0 ? `/?${qs}` : '/'
}
