import { fetchAll } from './bubble-client'
import { supabase } from './supabase-client'
import { buildIdMap } from './migration-log'
import { mapCurrency, mapStage } from './mappers'

interface BProject {
  _id: string
  nombre_text: string
  descripcion_corta_text?: string
  moneda_comercializacion_option_os_monedas?: string
  tipo_cambio_number?: number
  estadoavanceproyecto_option_os_estadoavanceproyecto?: string
  latitud1_text?: string
  longitud_text?: string
  amenidades_list_custom_amenidadesproyecto?: string[]
}

interface BModel {
  _id: string
  nombre_text?: string
  nomenclatura_text?: string
  area_interna_number?: number
  habitaciones_number?: number
  banios_number?: number
  parqueos_number?: number
  precio_desde_usd_number?: number
  cuota_desde_usd_number?: number
  active_boolean?: boolean
  proyecto_custom_proyectos?: string
  amenidades_list_custom_amenidadesproyecto?: string[]
}

interface BAmenidadProyecto {
  _id: string
  description_text?: string
}

async function main() {
  console.log('🔄 Data refresh starting\n')

  const [projects, models, amenidadesProyecto, projectMap, modelMap] = await Promise.all([
    fetchAll<BProject>('Proyectos'),
    fetchAll<BModel>('Modelos'),
    fetchAll<BAmenidadProyecto>('AmenidadesProyecto'),
    buildIdMap('projects'),
    buildIdMap('models'),
  ])

  const amenityNames = new Map(amenidadesProyecto.map(a => [a._id, a.description_text ?? '']))

  // Keyed by Bubble project ID — needed when computing model prices
  const projectCurrencyMap = new Map<string, { currency: 'USD' | 'GTQ'; exchangeRate: number }>()

  // ── Projects ───────────────────────────────────────────────────────────────
  console.log('=== Projects ===')
  let projUpdated = 0
  let projSkipped = 0

  for (const p of projects) {
    const supabaseId = projectMap.get(p._id)
    if (!supabaseId) { projSkipped++; continue }

    const currency = mapCurrency(p.moneda_comercializacion_option_os_monedas ?? '')
    const exchangeRate = p.tipo_cambio_number ?? 7.7
    projectCurrencyMap.set(p._id, { currency, exchangeRate })

    const amenities = (p.amenidades_list_custom_amenidadesproyecto ?? [])
      .map(id => amenityNames.get(id))
      .filter((n): n is string => !!n && n.length > 0)

    const latitude = p.latitud1_text ? parseFloat(p.latitud1_text) : null
    const longitude = p.longitud_text ? parseFloat(p.longitud_text) : null

    const { error } = await supabase
      .from('projects')
      .update({
        name: p.nombre_text,
        description: p.descripcion_corta_text ?? null,
        short_description: p.descripcion_corta_text ?? null,
        stage: mapStage(p.estadoavanceproyecto_option_os_estadoavanceproyecto ?? ''),
        base_currency: currency,
        exchange_rate: exchangeRate,
        amenities,
        latitude: latitude && !isNaN(latitude) ? latitude : null,
        longitude: longitude && !isNaN(longitude) ? longitude : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supabaseId)

    if (error) throw new Error(`Project update failed [${p.nombre_text}]: ${error.message}`)
    console.log(`  ✓ ${p.nombre_text} → ${currency}, rate: ${exchangeRate}`)
    projUpdated++
  }

  console.log(`\n  ${projUpdated} updated, ${projSkipped} not in migration log (skipped)`)

  // ── Models ─────────────────────────────────────────────────────────────────
  console.log('\n=== Models ===')
  let modUpdated = 0
  let modSkipped = 0

  for (const m of models) {
    const supabaseId = modelMap.get(m._id)
    if (!supabaseId) { modSkipped++; continue }

    const projectInfo = m.proyecto_custom_proyectos
      ? projectCurrencyMap.get(m.proyecto_custom_proyectos)
      : null

    // Fall back to USD/no-conversion if project wasn't in the log
    const { currency, exchangeRate } = projectInfo ?? { currency: 'USD' as const, exchangeRate: 7.7 }

    const usdPrice = m.precio_desde_usd_number ?? 0
    const usdMonthly = m.cuota_desde_usd_number ?? null

    // price_from is stored in project.base_currency per schema
    const priceFrom = currency === 'GTQ' ? usdPrice * exchangeRate : usdPrice
    const monthlyFrom = usdMonthly != null
      ? (currency === 'GTQ' ? usdMonthly * exchangeRate : usdMonthly)
      : null

    const name = m.nombre_text || m.nomenclatura_text || 'modelo'

    const amenities = (m.amenidades_list_custom_amenidadesproyecto ?? [])
      .map(id => amenityNames.get(id))
      .filter((n): n is string => !!n && n.length > 0)

    const { error } = await supabase
      .from('models')
      .update({
        name,
        size_m2: m.area_interna_number ?? null,
        bedrooms: m.habitaciones_number != null ? Math.round(m.habitaciones_number) : null,
        bathrooms: m.banios_number ?? null,
        parking_spots: m.parqueos_number != null ? Math.round(m.parqueos_number) : 0,
        price_from: priceFrom,
        monthly_payment_from: monthlyFrom,
        is_active: m.active_boolean ?? true,
        amenities,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supabaseId)

    if (error) throw new Error(`Model update failed [${name}]: ${error.message}`)
    modUpdated++
  }

  console.log(`  ${modUpdated} updated, ${modSkipped} not in migration log (skipped)`)
  console.log('\n✅ Data refresh complete')
}

main().catch(err => {
  console.error('\n❌ Data refresh failed:', err)
  process.exit(1)
})
