import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { ProjectCardData } from '@/lib/queries/home'
import { cheapestModelPricingByProject } from '@/lib/queries/pricing'

type PropertyType = Database['public']['Enums']['property_type']
type ZoneRow = Database['public']['Tables']['zones']['Row']

interface IndexScope {
  tipo?: PropertyType
  zoneId?: string
}

async function fetchIndexProjects(scope: IndexScope): Promise<ProjectCardData[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('projects')
    .select(
      'id, name, slug, property_type, base_currency, stage, short_description, is_featured, created_at, zones(name, url_slug)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (scope.tipo) query = query.eq('property_type', scope.tipo)
  if (scope.zoneId) query = query.eq('zone_id', scope.zoneId)

  const { data: projects, error } = await query.limit(120)
  if (error) throw error
  if (!projects || projects.length === 0) return []

  const ids = projects.map((p) => p.id)

  const [{ data: covers, error: coversErr }, { data: prices, error: pricesErr }] =
    await Promise.all([
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

  const pricingByProject = cheapestModelPricingByProject(prices ?? [])

  return projects.map((p) => {
    const zoneRel = p.zones as Pick<ZoneRow, 'name' | 'url_slug'> | null
    const cover = coverByProject.get(p.id) ?? null
    const pricing = pricingByProject.get(p.id) ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      property_type: p.property_type,
      base_currency: p.base_currency,
      stage: p.stage,
      short_description: p.short_description,
      is_featured: p.is_featured,
      zone: zoneRel ? { name: zoneRel.name, url_slug: zoneRel.url_slug } : null,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
      price_from: pricing?.price_from ?? null,
      monthly_payment_from: pricing?.monthly_payment_from ?? null,
    }
  })
}

export function getProjectsForIndex(scope: IndexScope): Promise<ProjectCardData[]> {
  const keyParts = ['index-projects', scope.tipo ?? '_', scope.zoneId ?? '_']
  const tags = ['projects:active']
  if (scope.tipo) tags.push(`tipo:${scope.tipo}`)
  if (scope.zoneId) tags.push(`zone-id:${scope.zoneId}`)
  return unstable_cache(() => fetchIndexProjects(scope), keyParts, {
    tags,
    revalidate: 3600,
  })()
}
