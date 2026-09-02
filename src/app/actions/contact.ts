'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/send-email'
import { redactEmails, resolveContactRecipients } from '@/lib/email/recipients'
import { getLeadBccEmails } from '@/lib/site-settings'
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
  const service = createServiceClient()

  // Public validation stays on the anon client. Recipient data is resolved only
  // with the server-only service client and is never included in rendered HTML.
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, name, developer_id')
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

  const [{ data: developer, error: developerErr }, { data: projectContacts, error: contactsErr }] =
    await Promise.all([
      service
        .from('developers')
        .select('contact_email, notification_emails')
        .eq('id', project.developer_id)
        .maybeSingle(),
      service
        .from('project_contacts')
        .select('email')
        .eq('project_id', project.id),
    ])

  if (developerErr) console.error('[contact] developer recipient lookup failed', redactEmails(developerErr.message))
  if (contactsErr) console.error('[contact] project recipient lookup failed', redactEmails(contactsErr.message))

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = h.get('user-agent') ?? null

  const { hp_company: _hp, ...payload } = parsed.data
  const { data: lead, error } = await service
    .from('contact_leads')
    .insert({
      ...payload,
      channel: 'form',
      ip_address: ip,
      user_agent: ua,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[contact] insert failed', redactEmails(error.message))
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

  const situaBccEmails = await getLeadBccEmails(process.env.SITUA_ADMIN_EMAIL ?? '')
  const recipients = resolveContactRecipients({
    developerEmails: [
      developer?.contact_email,
      ...((developer?.notification_emails as string[] | null) ?? []),
    ],
    projectEmails: (projectContacts ?? []).map((contact) => contact.email),
    excludedEmails: situaBccEmails,
  })

  const attemptedAt = new Date().toISOString()

  try {
    if (!recipients.length && !situaBccEmails.length) throw new Error('No contact email recipient configured')
    const to = recipients.length ? recipients : situaBccEmails
    const bcc = recipients.length ? situaBccEmails : []
    await sendEmail({
      subject: `Nueva consulta — ${project.name}`,
      html,
      to,
      bcc: bcc.length ? bcc : undefined,
      replyTo: parsed.data.email,
    })
    const { error: trackingError } = await service
      .from('contact_leads')
      .update({ email_attempted_at: attemptedAt, email_sent_at: new Date().toISOString(), email_error: null })
      .eq('id', lead.id)
    if (trackingError) console.error('[contact] email success tracking failed', redactEmails(trackingError.message))
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err)
    const safeMessage = redactEmails(rawMessage).slice(0, 2000)
    console.error('[contact] email failed', safeMessage)
    const { error: trackingError } = await service
      .from('contact_leads')
      .update({ email_attempted_at: attemptedAt, email_sent_at: null, email_error: safeMessage })
      .eq('id', lead.id)
    if (trackingError) console.error('[contact] email failure tracking failed', redactEmails(trackingError.message))
  }

  return { success: true }
}
