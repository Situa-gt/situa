'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sendgrid'
import { notifyWebhook } from '@/lib/webhook'

const ContactSchema = z.object({
  project_id: z.string().uuid(),
  model_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2, 'Ingresa tu nombre completo').max(100),
  email: z.string().trim().email('Correo inválido').max(255),
  phone: z
    .string()
    .trim()
    .max(30, 'Teléfono demasiado largo')
    .optional()
    .or(z.literal('').transform(() => undefined)),
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
    ip: ip,
  })

  const rows: [string, string][] = [
    ['Nombre', parsed.data.full_name],
    ['Correo', parsed.data.email],
    ['Teléfono', parsed.data.phone ?? '—'],
    ['Proyecto', project.name],
    ['Mensaje', parsed.data.message ?? '—'],
  ]

  const html = `
    <h2 style="margin-bottom:16px">Nueva consulta — ${escHtml(project.name)}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="font-weight:600;color:#555;padding-right:24px;white-space:nowrap">${escHtml(label)}</td>
          <td>${escHtml(value)}</td>
        </tr>`).join('')}
    </table>
  `

  const adminEmail = process.env.SITUA_ADMIN_EMAIL!
  const dev = project.developers
  const devEmails: string[] = [
    ...(dev?.contact_email ? [dev.contact_email] : []),
    ...((dev?.notification_emails as string[] | null) ?? []),
  ]

  // Primary recipient: developer (if available), else admin
  // Admin is always CC'd when developer receives the email
  const to = devEmails[0] ?? adminEmail
  const cc = devEmails[0]
    ? [...new Set([adminEmail, ...devEmails.slice(1)])]
    : undefined

  try {
    await sendEmail({
      subject: `Nueva consulta — ${project.name}`,
      html,
      to,
      cc,
      replyTo: parsed.data.email,
    })
  } catch (err) {
    console.error('[contact] email failed', err)
  }

  return { success: true }
}
