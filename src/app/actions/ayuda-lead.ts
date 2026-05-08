'use server'

import { z } from 'zod'
import { sendEmail } from '@/lib/email/sendgrid'

const AyudaLeadSchema = z.object({
  name: z.string().trim().min(1, 'Requerido').max(100),
  email: z.string().trim().email('Correo inválido').max(255),
  phone: z.string().trim().min(1, 'Requerido').max(30),
  message: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
})

export type AyudaLeadInput = z.input<typeof AyudaLeadSchema>

export type ActionResult =
  | { success: true }
  | { error: string; fields?: Record<string, string[]> }

export async function submitAyudaLead(input: unknown): Promise<ActionResult> {
  const parsed = AyudaLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Datos inválidos', fields: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const rows = [
    ['Nombre', d.name],
    ['Correo', d.email],
    ['Teléfono', d.phone],
    ['Mensaje', d.message ?? '—'],
  ]

  const html = `
    <h2 style="margin-bottom:16px">Nueva solicitud de ayuda — ${d.name}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="font-weight:600;color:#555;padding-right:24px;white-space:nowrap">${label}</td>
          <td>${value}</td>
        </tr>`).join('')}
    </table>
  `

  try {
    await sendEmail(`Nueva solicitud de ayuda — ${d.name}`, html)
  } catch (err) {
    console.error('[ayuda-lead] email failed', err)
  }

  return { success: true }
}
