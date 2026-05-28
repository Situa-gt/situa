'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sendgrid'

const DeveloperLeadSchema = z.object({
  developer_name: z.string().trim().min(1, 'Requerido').max(200),
  contact_name: z.string().trim().min(1, 'Requerido').max(100),
  phone: z.string().trim().min(1, 'Requerido').max(30),
  website: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
  discount_code: z.string().trim().max(100).optional().or(z.literal('').transform(() => undefined)),
  message: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
  hp_company: z
    .string()
    .max(0)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type DeveloperLeadInput = z.input<typeof DeveloperLeadSchema>

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

export async function submitDeveloperLead(input: unknown): Promise<ActionResult> {
  const parsed = DeveloperLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }
  }

  if (parsed.data.hp_company && parsed.data.hp_company.length > 0) {
    return { success: true }
  }

  const d = parsed.data
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = h.get('user-agent') ?? null

  const supabase = createServerClient()
  const { error: dbError } = await supabase.from('developer_leads').insert({
    developer_name: d.developer_name,
    contact_name: d.contact_name,
    phone: d.phone,
    website: d.website ?? null,
    discount_code: d.discount_code ?? null,
    message: d.message ?? null,
    ip_address: ip,
    user_agent: ua,
  })

  if (dbError) {
    console.error('[developer-lead] insert failed', dbError)
    return { error: 'Error al enviar. Intenta de nuevo.' }
  }

  const rows: [string, string][] = [
    ['Nombre desarrolladora', d.developer_name],
    ['Nombre contacto', d.contact_name],
    ['Teléfono', d.phone],
    ['Página Web', d.website ?? '—'],
    ['Código de descuento', d.discount_code ?? '—'],
    ['Mensaje', d.message ?? '—'],
  ]

  const html = `
    <h2 style="margin-bottom:16px">Nueva desarrolladora interesada — ${escHtml(d.developer_name)}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="font-weight:600;color:#555;padding-right:24px;white-space:nowrap">${escHtml(label)}</td>
          <td>${escHtml(value)}</td>
        </tr>`).join('')}
    </table>
  `

  try {
    await sendEmail({ subject: `Nueva desarrolladora — ${d.developer_name}`, html, to: process.env.SITUA_ADMIN_EMAIL! })
  } catch (err) {
    console.error('[developer-lead] email failed', err)
  }

  return { success: true }
}
