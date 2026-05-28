import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { Json } from '@/lib/database.types'

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|yandex/i

const AnalyticsSchema = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('project_view'),
    project_id: z.string().uuid(),
    session_id: z.string().max(64).optional(),
  }),
  z.object({
    event_type: z.literal('model_view'),
    project_id: z.string().uuid(),
    model_id: z.string().uuid(),
    session_id: z.string().max(64).optional(),
  }),
  z.object({
    event_type: z.literal('search'),
    filters: z.record(z.string(), z.unknown()).optional(),
    session_id: z.string().max(64).optional(),
  }),
])

export async function POST(req: Request) {
  const ua = (await headers()).get('user-agent') ?? ''
  if (BOT_PATTERNS.test(ua)) {
    return new Response(null, { status: 204 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const parsed = AnalyticsSchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const d = parsed.data
  const row = {
    event_type: d.event_type,
    project_id: 'project_id' in d ? d.project_id : null,
    model_id: 'model_id' in d ? d.model_id : null,
    filters: 'filters' in d ? (d.filters as Json ?? null) : null,
    session_id: d.session_id ?? null,
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('analytics_events').insert(row)

  if (error) {
    console.error('[analytics] insert failed', error.message)
    return new Response('Internal Server Error', { status: 500 })
  }

  return new Response(null, { status: 204 })
}
