import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { tipoSlug, type PropertyType } from '@/lib/types/property'
import { SITE_URL } from '@/lib/seo/site'

const STATIC_ROUTES: ReadonlyArray<{ path: string; changeFrequency: 'daily' | 'monthly'; priority: number }> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/calculadora', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/quienes-somos', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/politica-de-privacidad', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terminos-y-condiciones', changeFrequency: 'monthly', priority: 0.3 },
]

interface ZoneRow {
  url_slug: string
}

interface ProjectRow {
  slug: string
  property_type: PropertyType
  updated_at: string | null
  zones: { url_slug: string } | null
}

interface ModelRow {
  slug: string
  updated_at: string | null
  projects: {
    slug: string
    property_type: PropertyType
    is_active: boolean
    zones: { url_slug: string } | null
  } | null
}

async function fetchSitemapData() {
  const supabase = createServerClient()

  const [zonesRes, projectsRes, modelsRes] = await Promise.all([
    supabase
      .from('zones')
      .select('url_slug')
      .eq('is_active', true),
    supabase
      .from('projects')
      .select('slug, property_type, updated_at, zones(url_slug)')
      .eq('is_active', true),
    supabase
      .from('models')
      .select('slug, updated_at, projects!inner(slug, property_type, is_active, zones(url_slug))')
      .eq('is_active', true),
  ])

  if (zonesRes.error) throw zonesRes.error
  if (projectsRes.error) throw projectsRes.error
  if (modelsRes.error) throw modelsRes.error

  return {
    zones: (zonesRes.data ?? []) as ZoneRow[],
    projects: (projectsRes.data ?? []) as ProjectRow[],
    models: (modelsRes.data ?? []) as ModelRow[],
  }
}

const getCachedSitemapData = unstable_cache(fetchSitemapData, ['sitemap-v1'], {
  tags: ['projects:active', 'models:active', 'zones:active'],
  revalidate: 3600,
})

function toDate(value: string | null): Date {
  if (!value) return new Date()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { zones, projects, models } = await getCachedSitemapData()

  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const r of STATIC_ROUTES) {
    entries.push({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })
  }

  const tipoLastMod = new Map<PropertyType, Date>()
  for (const p of projects) {
    const d = toDate(p.updated_at)
    const current = tipoLastMod.get(p.property_type)
    tipoLastMod.set(p.property_type, current ? maxDate(current, d) : d)
  }

  for (const tipo of ['apartamento'] as const) {
    entries.push({
      url: `${SITE_URL}/${tipoSlug(tipo)}`,
      lastModified: tipoLastMod.get(tipo) ?? now,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  const zoneLastMod = new Map<string, Date>()
  for (const p of projects) {
    if (!p.zones) continue
    const d = toDate(p.updated_at)
    const current = zoneLastMod.get(p.zones.url_slug)
    zoneLastMod.set(p.zones.url_slug, current ? maxDate(current, d) : d)
  }

  for (const z of zones) {
    entries.push({
      url: `${SITE_URL}/${z.url_slug}`,
      lastModified: zoneLastMod.get(z.url_slug) ?? now,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  const zoneTipoLastMod = new Map<string, Date>()
  for (const p of projects) {
    if (!p.zones) continue
    if (p.property_type === 'casa') continue
    const key = `${p.zones.url_slug}/${tipoSlug(p.property_type)}`
    const d = toDate(p.updated_at)
    const current = zoneTipoLastMod.get(key)
    zoneTipoLastMod.set(key, current ? maxDate(current, d) : d)
  }

  for (const [path, lastModified] of zoneTipoLastMod) {
    entries.push({
      url: `${SITE_URL}/${path}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const p of projects) {
    if (!p.zones) continue
    entries.push({
      url: `${SITE_URL}/${p.zones.url_slug}/${tipoSlug(p.property_type)}/${p.slug}`,
      lastModified: toDate(p.updated_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  }

  for (const m of models) {
    if (!m.projects || !m.projects.is_active || !m.projects.zones) continue
    entries.push({
      url: `${SITE_URL}/${m.projects.zones.url_slug}/${tipoSlug(m.projects.property_type)}/${m.projects.slug}/${m.slug}`,
      lastModified: toDate(m.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return entries
}
