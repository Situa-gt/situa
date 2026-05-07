import { tipoSlug } from '@/lib/types/property'
import type { Filters } from '@/lib/filters/parse'

function withQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs.length > 0 ? `${path}?${qs}` : path
}

function extraParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.departamento) p.set('departamento', f.departamento)
  if (f.municipio) p.set('municipio', f.municipio)
  if (f.precio_min !== null) p.set('precio_min', String(f.precio_min))
  if (f.precio_max !== null) p.set('precio_max', String(f.precio_max))
  if (f.etapa) p.set('etapa', f.etapa)
  if (f.dormitorios !== null) p.set('dormitorios', String(f.dormitorios))
  return p
}

export function buildSearchUrl(f: Filters): string {
  const tipoPath = f.tipo ? tipoSlug(f.tipo) : null

  // Single zona → keep SEO-friendly path routing
  if (f.zonas.length === 1) {
    const extra = extraParams(f)
    if (tipoPath) return withQuery(`/${f.zonas[0]}/${tipoPath}`, extra)
    return withQuery(`/${f.zonas[0]}`, extra)
  }

  // No zona, tipo only → path routing
  if (f.zonas.length === 0 && tipoPath) {
    return withQuery(`/${tipoPath}`, extraParams(f))
  }

  // Multiple zonas or no routing key → full query params
  const all = extraParams(f)
  if (f.tipo) all.set('tipo', f.tipo)
  for (const z of f.zonas) all.append('zona', z)
  const qs = all.toString()
  return qs.length > 0 ? `/?${qs}` : '/'
}
