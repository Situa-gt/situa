import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { Filters } from '@/lib/filters/parse'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type SupabaseClient = ReturnType<typeof createServerClient>

async function projectIdsMatchingModelFilters(
  supabase: SupabaseClient,
  f: Filters,
): Promise<string[] | null> {
  const needsModelScan =
    f.dormitorios.length > 0 || f.precio_min !== null || f.precio_max !== null
  if (!needsModelScan) return null

  let query = supabase.from('models').select('project_id').eq('is_active', true)
  if (f.dormitorios.length > 0) query = query.in('bedrooms', f.dormitorios)
  if (f.precio_min !== null) query = query.gte('price_from', f.precio_min)
  if (f.precio_max !== null) query = query.lte('price_from', f.precio_max)

  const { data, error } = await query
  if (error) throw error
  return Array.from(new Set((data ?? []).map((m) => m.project_id)))
}

async function zoneIdsForLocation(
  supabase: SupabaseClient,
  f: Filters,
): Promise<string[] | null> {
  if (!f.departamento && !f.municipio && f.zonas.length === 0) return null

  let query = supabase.from('zones').select('id, url_slug, municipalities!inner(slug, departments!inner(slug))').eq('is_active', true)
  if (f.zonas.length > 0) query = query.in('url_slug', f.zonas)
  if (f.municipio) query = query.eq('municipalities.slug', f.municipio)
  if (f.departamento) query = query.eq('municipalities.departments.slug', f.departamento)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((z) => z.id)
}

export async function applyFilters(f: Filters): Promise<ProjectRow[]> {
  const supabase = createServerClient()

  const [modelProjectIds, zoneIds] = await Promise.all([
    projectIdsMatchingModelFilters(supabase, f),
    zoneIdsForLocation(supabase, f),
  ])

  if (modelProjectIds !== null && modelProjectIds.length === 0) return []
  if (zoneIds !== null && zoneIds.length === 0) return []

  let query = supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (f.tipo) query = query.eq('property_type', f.tipo)
  if (f.etapa) query = query.eq('stage', f.etapa)
  if (modelProjectIds !== null) query = query.in('id', modelProjectIds)
  if (zoneIds !== null) query = query.in('zone_id', zoneIds)

  const { data, error } = await query.limit(60)
  if (error) throw error
  return data ?? []
}
