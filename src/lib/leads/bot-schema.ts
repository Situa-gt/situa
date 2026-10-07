import { z } from 'zod'

const nullableText = z.string().nullable()
const nullableNumber = z.number().nonnegative().nullable()
export const BotLeadSchema = z.object({
  project_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  // Phone required, email optional (client decision 07-10-2026); empty email means not given.
  phone: z.string().min(8).max(20).regex(/^[\d +\-]+$/),
  email: z.union([z.string().email(), z.literal('')]),
  message: z.string().max(2000),
  qualification: z.object({
    property_type: z.enum(['apartamento', 'casa', 'ambas']).nullable(),
    purpose: z.enum(['vivir', 'invertir', 'ambas']).nullable(),
    budget_range: nullableText,
    budget_min_usd: nullableNumber,
    budget_max_usd: nullableNumber,
    monthly_payment_range: nullableText,
    monthly_payment_max_gtq: nullableNumber,
    down_payment: z.enum(['si', 'reuniendo', 'fraccionado']).nullable(),
    down_payment_amount: nullableText,
    bedrooms: z.number().int().nonnegative().nullable(),
    parking: z.number().int().nonnegative().nullable(),
    zones: z.array(z.string()),
    purchase_timing: z.enum(['esta_semana', 'este_mes', '3_meses', '6_meses', 'investigando']).nullable(),
    stage: z.enum(['planos', 'construccion', 'entrega_inmediata']).nullable(),
    living_situation: z.enum(['propia', 'rentando', 'familia']).nullable(),
    household: z.enum(['solo', 'pareja', 'pareja_hijos', 'familia_grande']).nullable(),
    pets: z.boolean().nullable(),
    answered_all: z.boolean(),
    turns: z.number().int().nonnegative(),
    duration_seconds: nullableNumber,
  }),
  lead_score: z.number().int().min(0).max(100),
  lead_tier: z.enum(['premium', 'muy_bueno', 'bueno', 'regular']),
  recommended_project_ids: z.array(z.string().uuid()),
  conversation_id: z.string().trim().min(1).max(64),
})
export type BotLeadInput = z.infer<typeof BotLeadSchema>
