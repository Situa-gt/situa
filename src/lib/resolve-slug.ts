import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { tipoFromSlug, type PropertyType } from '@/lib/types/property'
import type { Database } from '@/lib/database.types'

type ZoneRow = Database['public']['Tables']['zones']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

export type Resolved =
  | { kind: 'tipo'; data: { tipo: PropertyType } }
  | { kind: 'zone'; data: { zone: ZoneRow } }
  | { kind: 'zone-tipo'; data: { zone: ZoneRow; tipo: PropertyType } }
  | { kind: 'project'; data: { project: ProjectRow; zone: ZoneRow } }
  | { kind: 'not-found' }

async function resolveOneSegment(slug: string): Promise<Resolved> {
  const tipo = tipoFromSlug(slug)
  if (tipo) return { kind: 'tipo', data: { tipo } }

  const supabase = createServerClient()
  const { data: zone } = await supabase
    .from('zones')
    .select('*')
    .eq('url_slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (zone) return { kind: 'zone', data: { zone } }
  return { kind: 'not-found' }
}

async function resolveTwoSegments(zoneSlug: string, tipoStr: string): Promise<Resolved> {
  const tipo = tipoFromSlug(tipoStr)
  if (!tipo) return { kind: 'not-found' }

  const supabase = createServerClient()
  const { data: zone } = await supabase
    .from('zones')
    .select('*')
    .eq('url_slug', zoneSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (!zone) return { kind: 'not-found' }
  return { kind: 'zone-tipo', data: { zone, tipo } }
}

async function resolveThreeSegments(
  zoneSlug: string,
  tipoStr: string,
  projectSlug: string,
): Promise<Resolved> {
  const tipo = tipoFromSlug(tipoStr)
  if (!tipo) return { kind: 'not-found' }

  const supabase = createServerClient()
  const { data: zone } = await supabase
    .from('zones')
    .select('*')
    .eq('url_slug', zoneSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (!zone) return { kind: 'not-found' }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('zone_id', zone.id)
    .eq('slug', projectSlug)
    .eq('property_type', tipo)
    .eq('is_active', true)
    .maybeSingle()

  if (!project) return { kind: 'not-found' }
  return { kind: 'project', data: { project, zone } }
}

async function resolveSlugUncached(segments: string[]): Promise<Resolved> {
  if (segments.length === 1) return resolveOneSegment(segments[0])
  if (segments.length === 2) return resolveTwoSegments(segments[0], segments[1])
  if (segments.length === 3) return resolveThreeSegments(segments[0], segments[1], segments[2])
  return { kind: 'not-found' }
}

export function resolveSlug(segments: string[]): Promise<Resolved> {
  const cached = unstable_cache(
    () => resolveSlugUncached(segments),
    ['resolve-slug', ...segments],
    { tags: buildTags(segments), revalidate: 3600 },
  )
  return cached()
}

function buildTags(segments: string[]): string[] {
  const tags = ['slug:' + segments.join('/')]
  if (segments.length >= 1) tags.push('zone:' + segments[0])
  if (segments.length >= 3) tags.push('project:' + segments[2])
  return tags
}
