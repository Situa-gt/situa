import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import type { Database } from '@/lib/database.types'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ModelRow = Database['public']['Tables']['models']['Row']
type ZoneRow = Database['public']['Tables']['zones']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']
type AmenityRow = Database['public']['Tables']['amenities']['Row']
type ProjectAmenityRow = Database['public']['Tables']['project_amenities']['Row']

type AllowedTable =
  | 'projects'
  | 'models'
  | 'zones'
  | 'developers'
  | 'project_media'
  | 'brand_ticker_logos'
  | 'amenities'
  | 'project_amenities'

const ALLOWED_TABLES = new Set<AllowedTable>([
  'projects',
  'models',
  'zones',
  'developers',
  'project_media',
  'brand_ticker_logos',
  'amenities',
  'project_amenities',
])

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return timingSafeEqual(ab, bb)
}

async function addProjectIdsByDeveloper(tags: Set<string>, developerId: unknown) {
  if (typeof developerId !== 'string' || developerId.length === 0) return

  tags.add(`developer-id:${developerId}`)

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('developer_id', developerId)

  if (error) {
    console.error('[revalidate] developer projects lookup failed', error)
    return
  }

  for (const project of data ?? []) {
    if (project.id) tags.add(`project-id:${project.id}`)
  }
}

async function addProjectIdsByAmenity(tags: Set<string>, amenityId: unknown) {
  if (typeof amenityId !== 'string' || amenityId.length === 0) return

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('project_amenities')
    .select('project_id')
    .eq('amenity_id', amenityId)

  if (error) {
    console.error('[revalidate] amenity projects lookup failed', error)
    return
  }

  for (const item of data ?? []) {
    if (item.project_id) tags.add(`project-id:${item.project_id}`)
  }
}

async function deriveTags(table: AllowedTable, row: Record<string, unknown>): Promise<string[]> {
  const tags = new Set<string>()
  switch (table) {
    case 'projects': {
      const p = row as Partial<ProjectRow>
      tags.add('projects:active')
      tags.add('projects:slider')
      tags.add('projects:featured')
      tags.add('projects:banner')
      tags.add('projects:hero')
      tags.add('models:active')
      if (p.slug) tags.add(`project:${p.slug}`)
      if (p.id) tags.add(`project-id:${p.id}`)
      if (p.property_type) tags.add(`tipo:${p.property_type}`)
      if (p.zone_id) tags.add(`zone-id:${p.zone_id}`)
      if (p.developer_id) tags.add(`developer-id:${p.developer_id}`)
      break
    }
    case 'models': {
      const m = row as Partial<ModelRow>
      tags.add('projects:active')
      tags.add('models:active')
      tags.add('models:featured')
      if (m.slug) tags.add(`model:${m.slug}`)
      if (m.id) tags.add(`model-id:${m.id}`)
      if (m.project_id) tags.add(`project-id:${m.project_id}`)
      break
    }
    case 'zones': {
      const z = row as Partial<ZoneRow>
      tags.add('projects:active')
      tags.add('zones:active')
      tags.add('zones:list')
      if (z.id) tags.add(`zone-id:${z.id}`)
      if (z.url_slug) tags.add(`zone:${z.url_slug}`)
      break
    }
    case 'developers': {
      tags.add('projects:active')
      await addProjectIdsByDeveloper(tags, row.id)
      break
    }
    case 'project_media': {
      const mm = row as Partial<MediaRow>
      tags.add('projects:active')
      tags.add('models:active')
      if (mm.project_id) tags.add(`project-id:${mm.project_id}`)
      if (mm.model_id) tags.add(`model-id:${mm.model_id}`)
      if (mm.developer_id) await addProjectIdsByDeveloper(tags, mm.developer_id)
      break
    }
    case 'brand_ticker_logos': {
      tags.add('brand-ticker-logos')
      break
    }
    case 'amenities': {
      const a = row as Partial<AmenityRow>
      tags.add('amenities:active')
      tags.add('projects:active')
      tags.add('models:active')
      await addProjectIdsByAmenity(tags, a.id)
      break
    }
    case 'project_amenities': {
      const pa = row as Partial<ProjectAmenityRow>
      tags.add('amenities:active')
      tags.add('projects:active')
      tags.add('models:active')
      if (pa.project_id) tags.add(`project-id:${pa.project_id}`)
      if (pa.amenity_id) await addProjectIdsByAmenity(tags, pa.amenity_id)
      break
    }
  }
  return [...tags]
}

export async function POST(req: Request): Promise<Response> {
  const expected = process.env.REVALIDATION_SECRET ?? ''
  if (expected.length === 0) {
    return new Response('Server misconfigured', { status: 500 })
  }

  const provided = req.headers.get('x-revalidation-secret') ?? ''
  if (!constantTimeEqual(provided, expected)) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = (await req.json()) as WebhookPayload
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  if (!ALLOWED_TABLES.has(payload.table as AllowedTable)) {
    return new Response('Bad Request', { status: 400 })
  }
  const table = payload.table as AllowedTable

  const row =
    payload.type === 'DELETE'
      ? payload.old_record ?? null
      : payload.record ?? null

  if (!row) {
    return new Response('Bad Request', { status: 400 })
  }

  const tags = await deriveTags(table, row)
  for (const tag of tags) revalidateTag(tag, 'max')

  console.log('[revalidate]', {
    table,
    type: payload.type,
    row_id: typeof row.id === 'string' ? row.id : null,
    tags,
    t: Date.now(),
  })

  return Response.json({ ok: true, tags })
}
