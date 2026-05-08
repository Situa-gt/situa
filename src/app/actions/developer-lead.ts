'use server'

import { z } from 'zod'
import { sendEmail } from '@/lib/email/sendgrid'

const DeveloperLeadSchema = z.object({
  developer_name: z.string().trim().min(1, 'Requerido').max(200),
  contact_name: z.string().trim().min(1, 'Requerido').max(100),
  phone: z.string().trim().min(1, 'Requerido').max(30),
  website: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
  discount_code: z.string().trim().max(100).optional().or(z.literal('').transform(() => undefined)),
  message: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
})

export type DeveloperLeadInput = z.input<typeof DeveloperLeadSchema>

export type ActionResult =
  | { success: true }
  | { error: string; fields?: Record<string, string[]> }

export async function submitDeveloperLead(input: unknown): Promise<ActionResult> {
  const parsed = DeveloperLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const rows = [
    ['Nombre desarrolladora', d.developer_name],
    ['Nombre contacto', d.contact_name],
    ['Teléfono', d.phone],
    ['Página Web', d.website ?? '—'],
    ['Código de descuento', d.discount_code ?? '—'],
    ['Mensaje', d.message ?? '—'],
  ]

  const html = `
    <h2 style="margin-bottom:16px">Nueva desarrolladora interesada — ${d.developer_name}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="font-weight:600;color:#555;padding-right:24px;white-space:nowrap">${label}</td>
          <td>${value}</td>
        </tr>`).join('')}
    </table>
  `

  try {
    await sendEmail(`Nueva desarrolladora — ${d.developer_name}`, html)
  } catch (err) {
    console.error('[developer-lead] email failed', err)
  }

  return { success: true }
}
