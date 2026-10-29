import { createHash, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { BotLeadSchema } from './bot-schema'
import { createLead } from './create-lead'

const defaults = { createServiceClient, createLead, secret: () => process.env.BOT_LEADS_SECRET }
function json(body: object, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
export function botLeadHandler(deps = defaults) {
  return async (request: Request): Promise<Response> => {
    const secret = deps.secret()
    if (!secret) return json({ ok: false, error: 'Servicio no configurado.' }, 503)
    const supplied = request.headers.get('x-bot-secret') ?? ''
    // Hash both values so timingSafeEqual always receives equal-length buffers.
    const digest = (value: string) => createHash('sha256').update(value).digest()
    if (!timingSafeEqual(digest(supplied), digest(secret))) {
      return json({ ok: false, error: 'No autorizado.' }, 401)
    }
    let body: unknown
    try { body = await request.json() } catch {
      return json({ ok: false, error: 'JSON inválido.' }, 400)
    }
    const parsed = BotLeadSchema.safeParse(body)
    if (!parsed.success) return json({ ok: false, error: 'Datos inválidos.' }, 400)
    try {
      const service = deps.createServiceClient()
      const { data: project, error } = await service.from('projects')
        .select('id, name, developer_id').eq('id', parsed.data.project_id)
        .eq('is_active', true).maybeSingle()
      if (error) return json({ ok: false, error: 'Error al consultar proyecto.' }, 500)
      if (!project) return json({ ok: false, error: 'Proyecto no válido.' }, 404)
      const { warm, ...lead } = parsed.data
      if (warm) {
        // One warm lead per conversation, and none once it already sent its information:
        // a repeated or late call returns the lead already stored.
        const { data: existing, error: warmError } = await service.from('contact_leads')
          .select('id').eq('conversation_id', lead.conversation_id).order('is_warm', { ascending: true }).limit(1).maybeSingle()
        if (warmError) return json({ ok: false, error: 'Error al consultar conversación.' }, 500)
        if (existing) return json({ ok: true, lead_id: existing.id, email: 'skipped' }, 201)
      }
      // A sent lead for this project already exists in the conversation (a bot retry after a timeout):
      // return it without a second lead or a second email to the developer.
      const alreadySent = async () => {
        const { data } = await service.from('contact_leads').select('id')
          .eq('conversation_id', lead.conversation_id).eq('project_id', lead.project_id).eq('is_warm', false).limit(1).maybeSingle()
        return data?.id as string | undefined
      }
      if (!warm) {
        const sentId = await alreadySent()
        if (sentId) return json({ ok: true, lead_id: sentId, email: 'skipped' }, 201)
      }
      const { count, error: countError } = await service.from('contact_leads')
        .select('id', { count: 'exact', head: true }).eq('conversation_id', lead.conversation_id).eq('is_warm', false)
      if (countError) return json({ ok: false, error: 'Error al consultar conversación.' }, 500)
      if ((count ?? 0) >= 4) return json({ ok: false, error: 'Límite de leads por conversación.' }, 429)
      const result = await deps.createLead({ ...lead, is_warm: warm }, {
        channel: 'bot', project, warm,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        ua: request.headers.get('user-agent'),
      })
      if ('error' in result) {
        if (result.code === 'P0429') return json({ ok: false, error: 'Límite de leads por conversación.' }, 429)
        // Two identical calls in parallel: the unique index rejected the second one.
        if (result.code === '23505' && !warm) {
          const sentId = await alreadySent()
          if (sentId) return json({ ok: true, lead_id: sentId, email: 'skipped' }, 201)
        }
        return json({ ok: false, error: result.error }, 500)
      }
      if (!warm) {
        // The conversation sent its information: the sent lead replaces the warm one.
        const { error: cleanupError } = await service.from('contact_leads').delete()
          .eq('conversation_id', lead.conversation_id).eq('is_warm', true)
        if (cleanupError) console.error('[bot-lead] warm cleanup failed', cleanupError.code)
      }
      return json({ ok: true, lead_id: result.lead_id, email: result.email }, 201)
    } catch {
      return json({ ok: false, error: 'Error al enviar. Intenta de nuevo.' }, 500)
    }
  }
}
