'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createLead } from '@/lib/leads/create-lead'
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

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = h.get('user-agent') ?? null
  const { hp_company: _hp, ...payload } = parsed.data
  const result = await createLead(payload, { channel: 'form', ip, ua, project, modelName })
  if (result.error) return { error: result.error }
  return { success: true }
}
