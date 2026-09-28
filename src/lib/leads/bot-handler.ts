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
      const { count, error: countError } = await service.from('contact_leads')
        .select('id', { count: 'exact', head: true }).eq('conversation_id', parsed.data.conversation_id)
      if (countError) return json({ ok: false, error: 'Error al consultar conversación.' }, 500)
      if ((count ?? 0) >= 4) return json({ ok: false, error: 'Límite de leads por conversación.' }, 429)
      const result = await deps.createLead(parsed.data, {
        channel: 'bot', project,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        ua: request.headers.get('user-agent'),
      })
      if ('error' in result) {
        if (result.code === 'P0429') return json({ ok: false, error: 'Límite de leads por conversación.' }, 429)
        return json({ ok: false, error: result.error }, 500)
      }
      return json({ ok: true, lead_id: result.lead_id, email: result.email }, 201)
    } catch {
      return json({ ok: false, error: 'Error al enviar. Intenta de nuevo.' }, 500)
    }
  }
}
