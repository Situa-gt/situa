import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { ProjectCardData } from '@/lib/queries/home'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type Stage = Database['public']['Enums']['project_stage']

export interface SuggestedProjectData extends ProjectCardData {
  recommendation_reasons: string[]
  recommendation_score: number
}

interface CurrentProject {
  id: string
  property_type: ProjectRow['property_type']
  zone_id: string
  developer_id: string
  stage: Stage
  amenities: string[] | null
  base_currency: ProjectRow['base_currency']
  exchange_rate: number
  zones: { name: string; url_slug: string } | null
}

interface CandidateProject {
  id: string
  name: string
  slug: string
  property_type: ProjectRow['property_type']
  base_currency: ProjectRow['base_currency']
  exchange_rate: number
  stage: Stage
  short_description: string | null
  is_featured: boolean
  featured_priority: number
  amenities: string[] | null
  zone_id: string
  developer_id: string
  created_at: string
  zones: { name: string; url_slug: string } | null
}

interface MediaCover {
  project_id: string | null
  url: string
  alt: string | null
}

interface ModelPrice {
  project_id: string
  price_from: number
  monthly_payment_from: number | null
}

interface ViewCount {
  project_id: string | null
}

const NEARBY_ZONE_GROUPS = [
  ['zona-10', 'zona-14', 'zona-15'],
  ['zona-11', 'zona-12'],
  ['zona-13', 'zona-14'],
  ['zona-15', 'zona-16'],
]

function normalizePrice(value: number, currency: ProjectRow['base_currency'], rate: number): number {
  return currency === 'GTQ' ? value / rate : value
}

function withinPercent(base: number | null, candidate: number | null, percent: number): boolean {
  if (!base || !candidate) return false
  const delta = Math.abs(candidate - base) / base
  return delta <= percent
}

function sharedCount(a: string[] | null, b: string[] | null): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0
  const left = new Set(a.map((item) => item.toLowerCase().trim()))
  return b.reduce((count, item) => count + (left.has(item.toLowerCase().trim()) ? 1 : 0), 0)
}

function areNearbyZones(currentSlug: string | null, candidateSlug: string | null): boolean {
  if (!currentSlug || !candidateSlug || currentSlug === candidateSlug) return false
  return NEARBY_ZONE_GROUPS.some((group) => group.includes(currentSlug) && group.includes(candidateSlug))
}

function minimumByProject(
  prices: ModelPrice[],
  currencyByProject: Map<string, ProjectRow['base_currency']>,
  exchangeRateByProject: Map<string, number>,
): {
  price: Map<string, number>
  payment: Map<string, number>
} {
  const price = new Map<string, number>()
  const payment = new Map<string, number>()

  for (const row of prices) {
    const currency = currencyByProject.get(row.project_id) ?? 'USD'
    const rate = exchangeRateByProject.get(row.project_id) ?? 7.8
    const normalizedPrice = normalizePrice(row.price_from, currency, rate)
    const currentPrice = price.get(row.project_id)
    if (currentPrice === undefined || normalizedPrice < currentPrice) {
      price.set(row.project_id, normalizedPrice)
    }

    if (row.monthly_payment_from !== null) {
      const normalizedPayment = normalizePrice(row.monthly_payment_from, currency, rate)
      const currentPayment = payment.get(row.project_id)
      if (currentPayment === undefined || normalizedPayment < currentPayment) {
        payment.set(row.project_id, normalizedPayment)
      }
    }
  }

  return { price, payment }
}

function topReason(reasons: string[]): string[] {
  return reasons.slice(0, 3)
}

async function fetchSuggestedProjects(projectId: string, limit: number): Promise<SuggestedProjectData[]> {
  const supabase = createServerClient()

  const { data: current, error: currentError } = await supabase
    .from('projects')
    .select('id, property_type, zone_id, developer_id, stage, amenities, base_currency, exchange_rate, zones(name, url_slug)')
    .eq('id', projectId)
    .eq('is_active', true)
    .maybeSingle()

  if (currentError) throw currentError
  if (!current) return []

  const [
    { data: projects, error: projectsError },
    { data: prices, error: pricesError },
    { data: covers, error: coversError },
    { data: views, error: viewsError },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug, property_type, base_currency, exchange_rate, stage, short_description, is_featured, featured_priority, amenities, zone_id, developer_id, created_at, zones(name, url_slug)')
      .eq('is_active', true)
      .neq('id', projectId)
      .limit(120),
    supabase
      .from('models')
      .select('project_id, price_from, monthly_payment_from')
      .eq('is_active', true),
    supabase
      .from('project_media')
      .select('project_id, url, alt')
      .eq('kind', 'cover')
      .not('project_id', 'is', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('analytics_events')
      .select('project_id')
      .eq('event_type', 'project_view')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  if (projectsError) throw projectsError
  if (pricesError) throw pricesError
  if (coversError) throw coversError
  if (viewsError) throw viewsError
  if (!projects || projects.length === 0) return []

  const candidateRows = projects as unknown as CandidateProject[]
  const currentRow = current as CurrentProject

  const currencyByProject = new Map<string, ProjectRow['base_currency']>()
  const exchangeRateByProject = new Map<string, number>()
  currencyByProject.set(currentRow.id, currentRow.base_currency)
  exchangeRateByProject.set(currentRow.id, currentRow.exchange_rate)

  for (const project of candidateRows) {
    currencyByProject.set(project.id, project.base_currency)
    exchangeRateByProject.set(project.id, project.exchange_rate)
  }

  const allPrices = (prices ?? []) as ModelPrice[]
  const minimums = minimumByProject(allPrices, currencyByProject, exchangeRateByProject)
  const currentPrice = minimums.price.get(currentRow.id) ?? null
  const currentPayment = minimums.payment.get(currentRow.id) ?? null

  const coverByProject = new Map<string, { url: string; alt: string | null }>()
  for (const cover of (covers ?? []) as MediaCover[]) {
    if (cover.project_id && !coverByProject.has(cover.project_id)) {
      coverByProject.set(cover.project_id, { url: cover.url, alt: cover.alt })
    }
  }

  const viewsByProject = new Map<string, number>()
  for (const view of (views ?? []) as ViewCount[]) {
    if (!view.project_id || view.project_id === projectId) continue
    viewsByProject.set(view.project_id, (viewsByProject.get(view.project_id) ?? 0) + 1)
  }
  const maxViews = Math.max(1, ...viewsByProject.values())

  const currentZone = currentRow.zones

  const scored = candidateRows
    .map((candidate) => {
      const cover = coverByProject.get(candidate.id) ?? null
      const candidatePrice = minimums.price.get(candidate.id) ?? null
      const candidatePayment = minimums.payment.get(candidate.id) ?? null
      const reasons: string[] = []
      let score = 0

      if (candidate.property_type === currentRow.property_type) {
        score += 30
      }

      if (candidate.zone_id === currentRow.zone_id) {
        score += 35
        reasons.push('Misma zona')
      } else if (areNearbyZones(currentZone?.url_slug ?? null, candidate.zones?.url_slug ?? null)) {
        score += 15
        reasons.push('Zona cercana')
      }

      if (withinPercent(currentPrice, candidatePrice, 0.2)) {
        score += 25
        reasons.push('Precio similar')
      }

      if (withinPercent(currentPayment, candidatePayment, 0.2)) {
        score += 20
        reasons.push('Cuota similar')
      }

      if (candidate.stage === currentRow.stage) {
        score += 10
        reasons.push('Etapa similar')
      }

      const amenitiesScore = Math.min(sharedCount(currentRow.amenities, candidate.amenities), 5) * 2
      if (amenitiesScore > 0) {
        score += amenitiesScore
        reasons.push('Amenidades afines')
      }

      if (candidate.developer_id === currentRow.developer_id) {
        score += 5
        reasons.push('Misma desarrolladora')
      }

      if (candidate.is_featured) {
        score += 8
      }
      score += Math.min(candidate.featured_priority, 8)

      const viewsCount = viewsByProject.get(candidate.id) ?? 0
      if (viewsCount > 0) {
        score += Math.round((viewsCount / maxViews) * 15)
        reasons.push('Popular recientemente')
      }

      if (!cover) score -= 8
      if (!candidatePrice) score -= 5

      return {
        candidate,
        cover,
        candidatePrice,
        candidatePayment,
        score,
        reasons: reasons.length > 0 ? topReason(reasons) : ['Proyecto activo'],
      }
    })
    .sort((a, b) => b.score - a.score)

  const selected: typeof scored = []
  const developerCounts = new Map<string, number>()

  for (const item of scored) {
    const currentCount = developerCounts.get(item.candidate.developer_id) ?? 0
    if (currentCount >= 2 && selected.length >= 3) continue
    selected.push(item)
    developerCounts.set(item.candidate.developer_id, currentCount + 1)
    if (selected.length >= limit) break
  }

  return selected.map(({ candidate, cover, candidatePrice, candidatePayment, score, reasons }) => ({
    id: candidate.id,
    name: candidate.name,
    slug: candidate.slug,
    property_type: candidate.property_type,
    base_currency: 'USD',
    stage: candidate.stage,
    is_featured: candidate.is_featured,
    short_description: candidate.short_description,
    zone: candidate.zones ? { name: candidate.zones.name, url_slug: candidate.zones.url_slug } : null,
    cover_url: cover?.url ?? null,
    cover_alt: cover?.alt ?? null,
    price_from: candidatePrice,
    monthly_payment_from: candidatePayment,
    recommendation_reasons: reasons,
    recommendation_score: score,
  }))
}

export function getSuggestedProjects(projectId: string, limit = 6): Promise<SuggestedProjectData[]> {
  return unstable_cache(
    () => fetchSuggestedProjects(projectId, limit),
    ['project-suggestions-v1', projectId, String(limit)],
    {
      tags: ['projects:active', 'models:active', `project-id:${projectId}`],
      revalidate: 3600,
    },
  )()
}
