import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { Json } from '@/lib/database.types'

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|yandex/i

const BaseEventSchema = z.object({
  session_id: z.string().max(64).optional(),
  page_path: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
})

const AnalyticsSchema = z.discriminatedUnion('event_type', [
  BaseEventSchema.extend({
    event_type: z.literal('project_view'),
    project_id: z.string().uuid(),
  }),
  BaseEventSchema.extend({
    event_type: z.literal('model_view'),
    project_id: z.string().uuid(),
    model_id: z.string().uuid(),
  }),
  BaseEventSchema.extend({
    event_type: z.literal('search'),
    filters: z.record(z.string(), z.unknown()).optional(),
  }),
  BaseEventSchema.extend({
    event_type: z.literal('contact_form_start'),
    project_id: z.string().uuid(),
    model_id: z.string().uuid().optional(),
  }),
  BaseEventSchema.extend({
    event_type: z.literal('contact_form_submit'),
    project_id: z.string().uuid(),
    model_id: z.string().uuid().optional(),
  }),
  BaseEventSchema.extend({
    event_type: z.literal('calculator_submit'),
    filters: z.record(z.string(), z.unknown()).optional(),
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
    page_path: d.page_path ?? null,
    referrer: d.referrer ?? null,
    utm_source: d.utm_source ?? null,
    utm_medium: d.utm_medium ?? null,
    utm_campaign: d.utm_campaign ?? null,
    utm_content: d.utm_content ?? null,
    utm_term: d.utm_term ?? null,
    user_agent: ua || null,
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('analytics_events').insert(row)

  if (error) {
    const legacyRow = {
      event_type: d.event_type,
      project_id: 'project_id' in d ? d.project_id : null,
      model_id: 'model_id' in d ? d.model_id : null,
      filters: 'filters' in d ? (d.filters as Json ?? null) : null,
      session_id: d.session_id ?? null,
    }
    const canFallback =
      d.event_type === 'project_view' ||
      d.event_type === 'model_view' ||
      d.event_type === 'search'

    if (canFallback) {
      const retry = await supabase.from('analytics_events').insert(legacyRow)
      if (!retry.error) return new Response(null, { status: 204 })
    }

    console.error('[analytics] insert failed', error.message)
    return new Response(null, { status: 204 })
  }

  return new Response(null, { status: 204 })
}
