import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { cheapestModelPricingByProject } from '@/lib/queries/pricing'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ZoneRow = Database['public']['Tables']['zones']['Row']

export interface ProjectCardData {
  id: string
  name: string
  slug: string
  property_type: ProjectRow['property_type']
  base_currency: ProjectRow['base_currency']
  stage: ProjectRow['stage'] | null
  is_featured: boolean
  short_description: string | null
  zone: { name: string; url_slug: string } | null
  cover_url: string | null
  cover_alt: string | null
  price_from: number | null
  monthly_payment_from: number | null
}

interface OptionRow {
  slug: string
  name: string
}

async function fetchProjectCards(opts: {
  featuredOnly: boolean
  bannerOnly?: boolean
  limit: number
}): Promise<ProjectCardData[]> {
  const supabase = createServerClient()

  let projectsQuery = supabase
    .from('projects')
    .select('id, name, slug, property_type, base_currency, exchange_rate, stage, short_description, is_featured, featured_priority, featured_until, created_at, zones(name, url_slug)')
    .eq('is_active', true)

  if (opts.bannerOnly) {
    projectsQuery = projectsQuery
      .eq('publicidad_banner', true)
      .order('created_at', { ascending: false })
  } else if (opts.featuredOnly) {
    const nowIso = new Date().toISOString()
    projectsQuery = projectsQuery
      .eq('is_featured', true)
      .or(`featured_until.is.null,featured_until.gt.${nowIso}`)
      .order('featured_priority', { ascending: false })
      .order('created_at', { ascending: false })
  } else {
    projectsQuery = projectsQuery.order('created_at', { ascending: false })
  }


  const { data: projects, error } = await projectsQuery.limit(opts.limit)
  if (error) throw error
  if (!projects || projects.length === 0) return []

  const ids = projects.map((p) => p.id)

  const [{ data: covers, error: coversErr }, { data: prices, error: pricesErr }] = await Promise.all([
    supabase
      .from('project_media')
      .select('project_id, url, alt, display_order, kind')
      .in('project_id', ids)
      .eq('kind', 'cover')
      .order('display_order', { ascending: true }),
    supabase
      .from('models')
      .select('project_id, price_from, monthly_payment_from')
      .in('project_id', ids)
      .eq('is_active', true),
  ])
  if (coversErr) throw coversErr
  if (pricesErr) throw pricesErr

  const coverByProject = new Map<string, { url: string; alt: string | null }>()
  for (const c of covers ?? []) {
    if (!coverByProject.has(c.project_id!)) {
      coverByProject.set(c.project_id!, { url: c.url, alt: c.alt })
    }
  }

  const currencyByProject = new Map<string, ProjectRow['base_currency']>()
  const exchangeRateByProject = new Map<string, number>()
  for (const p of projects) {
    currencyByProject.set(p.id, p.base_currency)
    exchangeRateByProject.set(p.id, p.exchange_rate)
  }

  const pricingByProject = cheapestModelPricingByProject(prices ?? [], (projectId, value) => {
    const currency = currencyByProject.get(projectId) ?? 'USD'
    const rate = exchangeRateByProject.get(projectId) ?? 7.8
    return currency === 'GTQ' ? value / rate : value
  })

  return projects.map((p) => {
    const zoneRel = p.zones as Pick<ZoneRow, 'name' | 'url_slug'> | null
    const cover = coverByProject.get(p.id) ?? null
    const pricing = pricingByProject.get(p.id) ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      property_type: p.property_type,
      base_currency: 'USD' as const,
      stage: p.stage,
      is_featured: p.is_featured,
      short_description: p.short_description,
      zone: zoneRel ? { name: zoneRel.name, url_slug: zoneRel.url_slug } : null,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
      price_from: pricing?.price_from ?? null,
      monthly_payment_from: pricing?.monthly_payment_from ?? null,
    }
  })
}

export const getSliderProjects = unstable_cache(
  async () => fetchProjectCards({ featuredOnly: false, limit: 100 }),
  ['home', 'slider'],
  { tags: ['projects:slider', 'projects:active'], revalidate: 3600 },
)

export const getFeaturedProjects = unstable_cache(
  async () => fetchProjectCards({ featuredOnly: true, limit: 12 }),
  ['home', 'featured'],
  { tags: ['projects:featured', 'projects:active'], revalidate: 3600 },
)

export interface FeaturedModelCardData {
  id: string
  name: string
  slug: string
  price_from: number
  monthly_payment_from: number | null
  bedrooms: number | null
  project: {
    name: string
    slug: string
    property_type: ProjectRow['property_type']
    base_currency: ProjectRow['base_currency']
  }
  zone: { name: string; url_slug: string } | null
  cover_url: string | null
  cover_alt: string | null
}

async function fetchFeaturedModels(): Promise<FeaturedModelCardData[]> {
  const supabase = createServerClient()

  const { data: models, error } = await supabase
    .from('models')
    .select('id, name, slug, price_from, monthly_payment_from, bedrooms, project_id, projects(id, name, slug, property_type, base_currency, exchange_rate, zones(name, url_slug))')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(12)

  if (error) throw error
  if (!models || models.length === 0) return []

  const ids = models.map((m) => m.id)
  const { data: covers, error: coversErr } = await supabase
    .from('project_media')
    .select('model_id, url, alt, kind')
    .in('model_id', ids)
    .in('kind', ['floorplan', 'gallery'])
    .order('display_order', { ascending: true })
  if (coversErr) throw coversErr

  const coverByModel = new Map<string, { url: string; alt: string | null }>()
  // First pass: prefer floorplan
  for (const c of covers ?? []) {
    if (c.model_id && c.kind === 'floorplan' && !coverByModel.has(c.model_id)) {
      coverByModel.set(c.model_id, { url: c.url, alt: c.alt })
    }
  }
  // Second pass: fill gaps with gallery
  for (const c of covers ?? []) {
    if (c.model_id && c.kind === 'gallery' && !coverByModel.has(c.model_id)) {
      coverByModel.set(c.model_id, { url: c.url, alt: c.alt })
    }
  }

  return models.map((m) => {
    const projectRel = m.projects as unknown as {
      name: string; slug: string; property_type: ProjectRow['property_type']
      base_currency: ProjectRow['base_currency']; exchange_rate: number
      zones: { name: string; url_slug: string } | null
    } | null
    const cover = coverByModel.get(m.id) ?? null
    const baseCurrency = projectRel?.base_currency ?? 'USD'
    const rate = projectRel?.exchange_rate ?? 7.8
    const priceUSD = baseCurrency === 'GTQ' ? m.price_from / rate : m.price_from
    const paymentUSD = m.monthly_payment_from !== null && m.monthly_payment_from > 0
      ? (baseCurrency === 'GTQ' ? m.monthly_payment_from / rate : m.monthly_payment_from)
      : null
    return {
      id: m.id,
      name: m.name,
      slug: m.slug,
      price_from: priceUSD,
      monthly_payment_from: paymentUSD,
      bedrooms: m.bedrooms,
      project: projectRel
        ? { name: projectRel.name, slug: projectRel.slug, property_type: projectRel.property_type, base_currency: 'USD' as const }
        : { name: '', slug: '', property_type: 'apartamento' as const, base_currency: 'USD' as const },
      zone: projectRel?.zones ?? null,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
    }
  })
}

export const getFeaturedModels = unstable_cache(
  fetchFeaturedModels,
  ['home', 'featured-models'],
  { tags: ['models:featured', 'models:active'], revalidate: 3600 },
)

export const getBannerProjects = unstable_cache(
  async () => fetchProjectCards({ featuredOnly: false, bannerOnly: true, limit: 10 }),
  ['home', 'banner'],
  { tags: ['projects:banner', 'projects:active'], revalidate: 3600 },
)

export interface HeroProjectData {
  id: string
  name: string
  slug: string
  property_type: ProjectRow['property_type']
  zone: { name: string; url_slug: string } | null
  cover_url: string | null
  cover_alt: string | null
}

async function fetchHeroProjects(): Promise<HeroProjectData[]> {
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, property_type, zones(name, url_slug)')
    .eq('is_active', true)
    .filter('toma_canal_principal', 'eq', true)

  if (error) throw error
  if (!projects || projects.length === 0) return []

  const ids = projects.map((p) => p.id)
  const { data: covers, error: coversErr } = await supabase
    .from('project_media')
    .select('project_id, url, alt, display_order')
    .in('project_id', ids)
    .eq('kind', 'cover')
    .order('display_order', { ascending: true })
  if (coversErr) throw coversErr

  const coverByProject = new Map<string, { url: string; alt: string | null }>()
  for (const c of covers ?? []) {
    if (c.project_id && !coverByProject.has(c.project_id)) {
      coverByProject.set(c.project_id, { url: c.url, alt: c.alt })
    }
  }

  return projects.map((p) => {
    const zoneRel = p.zones as { name: string; url_slug: string } | null
    const cover = coverByProject.get(p.id) ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      property_type: p.property_type,
      zone: zoneRel,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
    }
  })
}

export const getHeroProjects = unstable_cache(
  fetchHeroProjects,
  ['home', 'hero-projects'],
  { tags: ['projects:hero', 'projects:active'], revalidate: 3600 },
)

async function fetchOptions(table: 'zones' | 'departments' | 'municipalities'): Promise<OptionRow[]> {
  const supabase = createServerClient()

  if (table === 'zones') {
    // Inner join ensures only zones that have at least one project are returned
    const { data, error } = await supabase
      .from('zones')
      .select('name, url_slug, projects!inner(id)')
      .eq('is_active', true)
      .eq('projects.is_active', true)
      .order('name', { ascending: true })
    if (error) throw error
    const rows = ((data ?? []) as Array<{ name: string; url_slug: string }>).map((r) => ({
      name: r.name,
      slug: r.url_slug,
    }))
    const seen = new Set<string>()
    const unique = rows.filter((r) => {
      if (seen.has(r.slug)) return false
      seen.add(r.slug)
      return true
    })
    return unique.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  }

  const slugColumn = 'slug'
  const { data, error } = await supabase
    .from(table)
    .select(`name, ${slugColumn}`)
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) throw error
  type Row = { name: string } & Record<string, string>
  const rows = (data as Row[] ?? []).map((r) => ({ name: r.name, slug: r[slugColumn] }))
  // Deduplicate by slug — same name can appear in multiple departments
  const seen = new Set<string>()
  const unique = rows.filter((r) => {
    if (seen.has(r.slug)) return false
    seen.add(r.slug)
    return true
  })
  // Natural sort so "Zona 2" comes before "Zona 10"
  return unique.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

export const getZoneOptions = unstable_cache(
  async () => fetchOptions('zones'),
  ['home', 'zone-options'],
  { tags: ['zones:list'], revalidate: 3600 },
)

export const getDepartmentOptions = unstable_cache(
  async () => fetchOptions('departments'),
  ['home', 'department-options'],
  { tags: ['departments:list'], revalidate: 3600 },
)

export const getMunicipalityOptions = unstable_cache(
  async () => fetchOptions('municipalities'),
  ['home', 'municipality-options'],
  { tags: ['municipalities:list'], revalidate: 3600 },
)

export interface DeveloperLogoData {
  developerId: string
  developerName: string
  url: string
  alt: string | null
}

async function fetchDeveloperLogos(): Promise<DeveloperLogoData[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('project_media')
    .select('url, alt, developer_id, developers(id, name)')
    .eq('kind', 'logo')
    .not('developer_id', 'is', null)
    .is('project_id', null)
  if (error) throw error
  type Row = typeof data extends (infer R)[] | null ? R : never
  return (data ?? [])
    .filter((r): r is Row & { developer_id: string; developers: { id: string; name: string } } =>
      r.developer_id !== null && r.developers !== null,
    )
    .map((r) => ({
      developerId: r.developer_id,
      developerName: (r.developers as { id: string; name: string }).name,
      url: r.url,
      alt: r.alt,
    }))
}

export const getDeveloperLogos = unstable_cache(
  fetchDeveloperLogos,
  ['home', 'developer-logos'],
  { tags: ['projects:active'], revalidate: 3600 },
)

export async function getProjectCardsByIds(ids: string[]): Promise<ProjectCardData[]> {
  if (ids.length === 0) return []
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, property_type, base_currency, exchange_rate, stage, is_featured, short_description, created_at, zones(name, url_slug)')
    .in('id', ids)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!projects || projects.length === 0) return []

  const projectIds = projects.map((p) => p.id)

  const [{ data: covers, error: coversErr }, { data: prices, error: pricesErr }] = await Promise.all([
    supabase
      .from('project_media')
      .select('project_id, url, alt, display_order, kind')
      .in('project_id', projectIds)
      .eq('kind', 'cover')
      .order('display_order', { ascending: true }),
    supabase
      .from('models')
      .select('project_id, price_from, monthly_payment_from')
      .in('project_id', projectIds)
      .eq('is_active', true),
  ])
  if (coversErr) throw coversErr
  if (pricesErr) throw pricesErr

  const coverByProject = new Map<string, { url: string; alt: string | null }>()
  for (const c of covers ?? []) {
    if (!coverByProject.has(c.project_id!)) {
      coverByProject.set(c.project_id!, { url: c.url, alt: c.alt })
    }
  }

  const currencyByProject = new Map<string, ProjectRow['base_currency']>()
  const exchangeRateByProject = new Map<string, number>()
  for (const p of projects) {
    currencyByProject.set(p.id, p.base_currency)
    exchangeRateByProject.set(p.id, p.exchange_rate)
  }

  const pricingByProject = cheapestModelPricingByProject(prices ?? [], (projectId, value) => {
    const currency = currencyByProject.get(projectId) ?? 'USD'
    const rate = exchangeRateByProject.get(projectId) ?? 7.8
    return currency === 'GTQ' ? value / rate : value
  })

  return projects.map((p) => {
    const zoneRel = p.zones as Pick<ZoneRow, 'name' | 'url_slug'> | null
    const cover = coverByProject.get(p.id) ?? null
    const pricing = pricingByProject.get(p.id) ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      property_type: p.property_type,
      base_currency: 'USD' as const,
      stage: p.stage,
      is_featured: p.is_featured,
      short_description: p.short_description,
      zone: zoneRel ? { name: zoneRel.name, url_slug: zoneRel.url_slug } : null,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
      price_from: pricing?.price_from ?? null,
      monthly_payment_from: pricing?.monthly_payment_from ?? null,
    }
  })
}
