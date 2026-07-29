'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'
import { notifyWebhook } from '@/lib/webhook'
import { normalizePhone } from '@/lib/phone'

const OptionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined
    const normalized = normalizePhone(value)
    if (!normalized.ok) {
      ctx.addIssue({ code: 'custom', message: normalized.error })
      return z.NEVER
    }
    return normalized.phone
  })

const ContactSchema = z.object({
  project_id: z.string().uuid(),
  model_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2, 'Ingresa tu nombre completo').max(100),
  email: z.string().trim().email('Correo inválido').max(255).transform((email) => email.toLowerCase()),
  phone: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    OptionalPhoneSchema,
  ),
  message: z
    .string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  hp_company: z
    .string()
    .max(0)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  utm_source: z.string().max(64).optional(),
  utm_medium: z.string().max(64).optional(),
  utm_campaign: z.string().max(64).optional(),
  utm_term: z.string().max(64).optional(),
  utm_content: z.string().max(64).optional(),
})

export type ContactInput = z.input<typeof ContactSchema>

export type ActionResult =
  | { success: true }
  | { error: string; fields?: Record<string, string[]> }

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="width:210px;padding:12px 16px;color:#6b7280;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #edf0f6;background:#fafbff">${escHtml(label)}</td>
      <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:600;border-bottom:1px solid #edf0f6">${escHtml(value)}</td>
    </tr>`
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return [...new Set(emails.map((email) => email?.trim().toLowerCase()).filter((email): email is string => Boolean(email)))]
}

export async function submitContactLead(
  input: unknown,
): Promise<ActionResult> {
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: 'Datos inválidos',
      fields: parsed.error.flatten().fieldErrors,
    }
  }

  if (parsed.data.hp_company && parsed.data.hp_company.length > 0) {
    return { success: true }
  }

  const supabase = createServerClient()

  // Verify project exists and is active; fetch developer email for notification
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, name, developers(contact_email, notification_emails)')
    .eq('id', parsed.data.project_id)
    .eq('is_active', true)
    .maybeSingle()

  if (projectErr || !project) {
    return { error: 'Proyecto no válido.' }
  }

  let modelName: string | null = null

  // Verify model belongs to this project if provided
  if (parsed.data.model_id) {
    const { data: model, error: modelErr } = await supabase
      .from('models')
      .select('id, name')
      .eq('id', parsed.data.model_id)
      .eq('project_id', parsed.data.project_id)
      .eq('is_active', true)
      .maybeSingle()

    if (modelErr || !model) {
      return { error: 'Modelo no válido.' }
    }

    modelName = model.name
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = h.get('user-agent') ?? null

  const { hp_company: _hp, ...payload } = parsed.data
  const { error } = await supabase.from('contact_leads').insert({
    ...payload,
    channel: 'form',
    ip_address: ip,
    user_agent: ua,
  })

  if (error) {
    console.error('[contact] insert failed', error)
    return { error: 'Error al enviar. Intenta de nuevo.' }
  }

  void notifyWebhook({
    form: 'contact',
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    project_id: parsed.data.project_id,
    project_name: project.name,
    model_id: parsed.data.model_id ?? null,
    message: parsed.data.message ?? null,
    utm_source: parsed.data.utm_source ?? null,
    utm_medium: parsed.data.utm_medium ?? null,
    utm_campaign: parsed.data.utm_campaign ?? null,
    utm_term: parsed.data.utm_term ?? null,
    utm_content: parsed.data.utm_content ?? null,
    ip: ip,
  })

  const html = `
    <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <div style="max-width:720px;margin:0 auto;padding:28px 16px">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(28,31,61,.08)">
          <div style="background:#6b66eb;padding:26px 30px;color:#ffffff">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.88">Sitúa.gt</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.18;font-weight:800">Nuevo prospecto generado</h1>
          </div>

          <div style="padding:28px 30px">
            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Datos del prospecto</h2>
            <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #edf0f6;border-radius:14px;overflow:hidden;margin-bottom:28px">
              ${infoRow('Nombre', parsed.data.full_name)}
              ${infoRow('Correo electrónico', parsed.data.email)}
              ${infoRow('Teléfono', parsed.data.phone ?? 'No indicado')}
            </table>

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Proyecto de interés</h2>
            <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #edf0f6;border-radius:14px;overflow:hidden;margin-bottom:28px">
              ${infoRow('Proyecto', project.name)}
              ${modelName ? infoRow('Modelo', modelName) : ''}
            </table>

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Consulta del prospecto</h2>
            <div style="border-left:5px solid #6b66eb;background:#f7f6ff;border-radius:12px;padding:18px 20px;color:#1f2937;font-size:16px;line-height:1.65">
              ${escHtml(parsed.data.message ?? 'Sin mensaje adicional.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const adminEmail = process.env.SITUA_ADMIN_EMAIL!
  const dev = project.developers
  const devEmails = uniqueEmails([
    dev?.contact_email,
    ...((dev?.notification_emails as string[] | null) ?? []),
  ]).filter((email) => email !== adminEmail.trim().toLowerCase())

  try {
    await sendEmail({
      subject: `Nueva consulta — ${project.name}`,
      html,
      to: adminEmail,
      cc: devEmails.length ? devEmails : undefined,
      replyTo: parsed.data.email,
    })
  } catch (err) {
    console.error('[contact] email failed', err)
  }

  return { success: true }
}
