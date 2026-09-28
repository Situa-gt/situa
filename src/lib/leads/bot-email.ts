import type { BotLeadInput } from './bot-schema'

export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Human labels for the contract's enum values. Anything unknown is shown capitalized.
const labels: Record<string, string> = {
  apartamento: 'Apartamento', casa: 'Casa', ambas: 'Ambas',
  vivir: 'Vivir', invertir: 'Invertir',
  si: 'Sí, cuenta con enganche', reuniendo: 'Lo está reuniendo', fraccionado: 'Necesita enganche fraccionado',
  esta_semana: 'Esta semana', este_mes: 'Este mes', '3_meses': 'En 3 meses',
  '6_meses': 'En 6 meses', investigando: 'Solo está investigando',
  planos: 'En planos', construccion: 'En construcción', entrega_inmediata: 'Entrega inmediata',
  propia: 'Vivienda propia', rentando: 'Rentando', familia: 'Con familia',
  solo: 'Solo', pareja: 'Pareja', pareja_hijos: 'Pareja con hijos', familia_grande: 'Familia grande',
}
const tierLabels: Record<string, string> = {
  premium: 'Lead Premium', muy_bueno: 'Lead Muy Bueno', bueno: 'Lead Bueno', regular: 'Lead Regular',
}
const tierColors: Record<string, string> = { premium: '#15803d', muy_bueno: '#1d4ed8', bueno: '#b45309', regular: '#6b7280' }

function zoneLabel(slug: string): string {
  const match = /^zona-(\d+)$/i.exec(slug.trim())
  return match ? `Zona ${match[1]}` : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function money(value: number, currency: 'USD' | 'GTQ'): string {
  const n = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 0 }).format(value)
  return currency === 'USD' ? `US$${n}` : `Q${n}`
}
function budgetText(q: BotLeadInput['qualification']): string | null {
  if (q.budget_min_usd != null && q.budget_max_usd != null) return `${money(q.budget_min_usd, 'USD')} – ${money(q.budget_max_usd, 'USD')}`
  if (q.budget_max_usd != null) return `Hasta ${money(q.budget_max_usd, 'USD')}`
  if (q.budget_min_usd != null) return `Desde ${money(q.budget_min_usd, 'USD')}`
  return q.budget_range
}
function paymentText(q: BotLeadInput['qualification']): string | null {
  if (q.monthly_payment_max_gtq != null) return `Hasta ${money(q.monthly_payment_max_gtq, 'GTQ')} al mes`
  return q.monthly_payment_range
}
function display(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const text = String(value)
  return labels[text] ?? text
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="width:210px;padding:12px 16px;color:#6b7280;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #edf0f6;background:#fafbff">${escHtml(label)}</td>
      <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:600;border-bottom:1px solid #edf0f6">${escHtml(value)}</td>
    </tr>`
}
function table(rows: Array<[string, string | number | boolean | null | undefined]>): string {
  const body = rows
    .filter((row): row is [string, string | number | boolean] => row[1] !== null && row[1] !== undefined && row[1] !== '')
    .map(([label, value]) => infoRow(label, display(value)))
    .join('')
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #edf0f6;border-radius:14px;overflow:hidden;margin-bottom:28px">${body}</table>`
}

/** Same visual shell as the form email, with the qualification card from the client's guide. */
export function botLeadEmail(input: BotLeadInput, leadId: string, projectName: string) {
  const q = input.qualification
  const tier = tierLabels[input.lead_tier] ?? input.lead_tier
  const tierColor = tierColors[input.lead_tier] ?? '#6b7280'
  const downPayment = q.down_payment
    ? `${display(q.down_payment)}${q.down_payment_amount ? ` · ${q.down_payment_amount}` : ''}`
    : null

  const html = `
    <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <div style="max-width:720px;margin:0 auto;padding:28px 16px">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(28,31,61,.08)">
          <div style="background:#6b66eb;padding:26px 30px;color:#ffffff">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.88">Sitúa.gt · Asistente virtual</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.18;font-weight:800">Nuevo lead calificado</h1>
            <div style="margin-top:10px;font-size:14px;opacity:.9">Lead #${escHtml(leadId.slice(0, 8))} · ${escHtml(projectName)}</div>
          </div>

          <div style="padding:28px 30px">
            <div style="display:inline-block;margin-bottom:24px;padding:10px 16px;border-radius:999px;background:${tierColor};color:#ffffff;font-size:15px;font-weight:700">
              Score ${input.lead_score}/100 · ${escHtml(tier)}
            </div>

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Datos del prospecto</h2>
            ${table([
              ['Nombre', input.full_name],
              ['Teléfono', input.phone],
              ['Correo electrónico', input.email || null],
            ])}

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Lo que busca</h2>
            ${table([
              ['Busca', q.property_type],
              ['Proyecto de interés', projectName],
              ['Zonas', q.zones.length ? q.zones.map(zoneLabel).join(', ') : null],
              ['Dormitorios', q.bedrooms],
              ['Parqueos', q.parking],
              ['Presupuesto', budgetText(q)],
              ['Cuota ideal', paymentText(q)],
              ['Etapa', q.stage],
              ['Mascota', q.pets],
            ])}

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Calificación</h2>
            ${table([
              ['Motivo', q.purpose],
              ['Enganche', downPayment],
              ['Tiempo de compra', q.purchase_timing],
              ['Situación actual', q.living_situation],
              ['Familia', q.household],
            ])}

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Resumen de la conversación</h2>
            <div style="border-left:5px solid #6b66eb;background:#f7f6ff;border-radius:12px;padding:18px 20px;color:#1f2937;font-size:16px;line-height:1.65">
              ${escHtml(input.message)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  return {
    subject: `Nuevo lead calificado del asistente · ${projectName} · Score ${input.lead_score}/100`,
    html,
  }
}
