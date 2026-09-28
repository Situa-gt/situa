import type { BotLeadInput } from './bot-schema'

export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
const labels: Record<string, string> = {
  si: 'Sí', reuniendo: 'Reuniendo', fraccionado: 'Fraccionado',
  esta_semana: 'Esta semana', este_mes: 'Este mes', '3_meses': 'En 3 meses',
  '6_meses': 'En 6 meses', investigando: 'Investigando',
  planos: 'En planos', construccion: 'En construcción', entrega_inmediata: 'Entrega inmediata',
  propia: 'Vivienda propia', rentando: 'Rentando', familia: 'Con familia',
  solo: 'Solo', pareja: 'Pareja', pareja_hijos: 'Pareja con hijos', familia_grande: 'Familia grande',
}
export function botLeadEmail(input: BotLeadInput, leadId: string, projectName: string) {
  const q = input.qualification
  const rows: Array<[string, string | number | boolean | null]> = [
    ['Nombre', input.full_name], ['Teléfono', input.phone], ['Correo', input.email || null],
    ['Busca', q.property_type], ['Zona(s)', q.zones.length ? q.zones.join(', ') : null],
    ['Dormitorios', q.bedrooms], ['Estacionamientos', q.parking],
    ['Presupuesto', q.budget_range], ['Presupuesto mínimo USD', q.budget_min_usd],
    ['Presupuesto máximo USD', q.budget_max_usd], ['Cuota ideal', q.monthly_payment_range],
    ['Cuota máxima GTQ', q.monthly_payment_max_gtq], ['Motivo', q.purpose],
    ['Enganche', q.down_payment], ['Monto de enganche', q.down_payment_amount],
    ['Tiempo de compra', q.purchase_timing], ['Etapa', q.stage],
    ['Situación', q.living_situation], ['Familia', q.household], ['Mascota', q.pets],
  ]
  const items = rows.filter(([, value]) => value !== null).map(([label, value]) => {
    const display = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
    return `<li><strong>${escHtml(label)}:</strong> ${escHtml(labels[display] ?? display)}</li>`
  }).join('')
  return {
    subject: `Nuevo lead calificado del asistente · ${projectName} · Score ${input.lead_score}/100`,
    html: `<h1>Lead #${escHtml(leadId.slice(0, 8))}</h1><h2>${escHtml(projectName)}</h2><ul>${items}</ul><p>Score: ${input.lead_score}/100 (${escHtml(input.lead_tier)})</p><p>${escHtml(input.message)}</p>`,
  }
}
