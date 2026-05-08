'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sendgrid'

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
  project_name: z.string().max(200).optional(),
  model_name: z.string().max(200).optional(),
})

export type ContactInput = z.input<typeof ContactSchema>

export type ActionResult =
  | { success: true }
  | { error: string; fields?: Record<string, string[]> }

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

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = h.get('user-agent') ?? null

  const supabase = createServerClient()
  const { hp_company: _hp, project_name, model_name, ...payload } = parsed.data
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

  const rows = [
    ['Nombre', parsed.data.full_name],
    ['Correo', parsed.data.email],
    ['Teléfono', parsed.data.phone ?? '—'],
    ['Proyecto', project_name ?? parsed.data.project_id],
    ['Modelo', model_name ?? parsed.data.model_id ?? '—'],
    ['Mensaje', parsed.data.message ?? '—'],
  ]

  const html = `
    <h2 style="margin-bottom:16px">Nueva consulta — ${project_name ?? 'Proyecto'}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="font-weight:600;color:#555;padding-right:24px;white-space:nowrap">${label}</td>
          <td>${value}</td>
        </tr>`).join('')}
    </table>
  `

  try {
    await sendEmail(`Nueva consulta — ${project_name ?? 'Proyecto'}`, html)
  } catch (err) {
    console.error('[contact] email failed', err)
  }

  return { success: true }
}
