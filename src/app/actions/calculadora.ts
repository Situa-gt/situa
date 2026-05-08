'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { ProjectCardData } from '@/lib/queries/home'
import type { Database } from '@/lib/database.types'

type ZoneRow = Database['public']['Tables']['zones']['Row']

export async function fetchAllActiveProjects(): Promise<ProjectCardData[]> {
  const supabase = createServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      'id, name, slug, property_type, base_currency, stage, exchange_rate, short_description, created_at, zones(name, url_slug)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error('No se pudieron cargar los proyectos.')
  if (!projects || projects.length === 0) return []

  const ids = projects.map((p) => p.id)

  const [{ data: covers, error: coversErr }, { data: prices, error: pricesErr }] =
    await Promise.all([
      supabase
        .from('project_media')
        .select('project_id, url, alt, display_order')
        .in('project_id', ids)
        .eq('kind', 'cover')
        .order('display_order', { ascending: true }),
      supabase
        .from('models')
        .select('project_id, price_from, monthly_payment_from')
        .in('project_id', ids)
        .eq('is_active', true),
    ])

  if (coversErr) throw new Error('No se pudieron cargar los proyectos.')
  if (pricesErr) throw new Error('No se pudieron cargar los proyectos.')

  const coverByProject = new Map<string, { url: string; alt: string | null }>()
  for (const c of covers ?? []) {
    if (!coverByProject.has(c.project_id!)) {
      coverByProject.set(c.project_id!, { url: c.url, alt: c.alt })
    }
  }

  const minPriceByProject = new Map<string, number>()
  const minPaymentByProject = new Map<string, number>()
  for (const p of prices ?? []) {
    const cur = minPriceByProject.get(p.project_id)
    if (cur === undefined || p.price_from < cur) {
      minPriceByProject.set(p.project_id, p.price_from)
    }
    if (p.monthly_payment_from !== null) {
      const curPmt = minPaymentByProject.get(p.project_id)
      if (curPmt === undefined || p.monthly_payment_from < curPmt) {
        minPaymentByProject.set(p.project_id, p.monthly_payment_from)
      }
    }
  }

  return projects.map((p) => {
    const zoneRel = p.zones as Pick<ZoneRow, 'name' | 'url_slug'> | null
    const cover = coverByProject.get(p.id) ?? null
    const price = minPriceByProject.get(p.id) ?? null
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      property_type: p.property_type,
      base_currency: p.base_currency,
      stage: p.stage,
      short_description: p.short_description,
      zone: zoneRel ? { name: zoneRel.name, url_slug: zoneRel.url_slug } : null,
      cover_url: cover?.url ?? null,
      cover_alt: cover?.alt ?? null,
      price_from: price,
      monthly_payment_from: minPaymentByProject.get(p.id) ?? null,
    }
  })
}
