import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import type { Database } from '@/lib/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ModelRow = Database['public']['Tables']['models']['Row']
type ZoneRow = Database['public']['Tables']['zones']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

type AllowedTable = 'projects' | 'models' | 'zones' | 'developers' | 'project_media' | 'brand_ticker_logos'

const ALLOWED_TABLES = new Set<AllowedTable>([
  'projects',
  'models',
  'zones',
  'developers',
  'project_media',
  'brand_ticker_logos',
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

function deriveTags(table: AllowedTable, row: Record<string, unknown>): string[] {
  const tags = new Set<string>()
  switch (table) {
    case 'projects': {
      const p = row as Partial<ProjectRow>
      tags.add('projects:active')
      tags.add('projects:slider')
      tags.add('projects:featured')
      tags.add('projects:banner')
      if (p.slug) tags.add(`project:${p.slug}`)
      if (p.id) tags.add(`project-id:${p.id}`)
      if (p.property_type) tags.add(`tipo:${p.property_type}`)
      if (p.zone_id) tags.add(`zone-id:${p.zone_id}`)
      break
    }
    case 'models': {
      const m = row as Partial<ModelRow>
      tags.add('models:active')
      tags.add('models:featured')
      if (m.slug) tags.add(`model:${m.slug}`)
      if (m.id) tags.add(`model-id:${m.id}`)
      if (m.project_id) tags.add(`project-id:${m.project_id}`)
      break
    }
    case 'zones': {
      const z = row as Partial<ZoneRow>
      tags.add('zones:active')
      tags.add('zones:list')
      if (z.id) tags.add(`zone-id:${z.id}`)
      if (z.url_slug) tags.add(`zone:${z.url_slug}`)
      break
    }
    case 'developers': {
      tags.add('projects:active')
      break
    }
    case 'project_media': {
      const mm = row as Partial<MediaRow>
      tags.add('projects:active')
      tags.add('models:active')
      if (mm.project_id) tags.add(`project-id:${mm.project_id}`)
      break
    }
    case 'brand_ticker_logos': {
      tags.add('brand-ticker-logos')
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

  const tags = deriveTags(table, row)
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
