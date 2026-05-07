import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { logMigration, getSupabaseId, buildIdMap } from '../migration-log'
import { slugify, uniqueSlug } from '../slugify'

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

export async function runPhase4() {
  console.log('\n=== Phase 4: Models ===')

  const models = await fetchAll<BModel>('Modelos')
  console.log(`  ${models.length} models`)

  const amenidadesProyecto = await fetchAll<BAmenidadProyecto>('AmenidadesProyecto')
  const amenityNames = new Map(amenidadesProyecto.map(a => [a._id, a.description_text ?? '']))

  const projectMap = await buildIdMap('projects')

  // Pre-seed slug sets from models already in the database (idempotency)
  const { data: existingModels } = await supabase
    .from('models')
    .select('project_id, slug')
  const slugsByProject = new Map<string, Set<string>>()
  for (const row of existingModels ?? []) {
    if (!slugsByProject.has(row.project_id)) slugsByProject.set(row.project_id, new Set())
    slugsByProject.get(row.project_id)!.add(row.slug)
  }

  let inserted = 0
  let skipped = 0

  for (const m of models) {
    if (await getSupabaseId(m._id, 'models')) { skipped++; continue }

    const projectId = m.proyecto_custom_proyectos
      ? projectMap.get(m.proyecto_custom_proyectos)
      : null

    if (!projectId) {
      console.warn(`  ⚠  Model "${m.nombre_text}" has no parent project, skipping`)
      skipped++
      continue
    }

    if (!slugsByProject.has(projectId)) slugsByProject.set(projectId, new Set())
    const usedSlugs = slugsByProject.get(projectId)!
    const name = m.nombre_text || m.nomenclatura_text || 'modelo'
    // Ensure slug meets the 2-char minimum; fall back to nomenclatura or index
    let rawSlug = slugify(name)
    if (rawSlug.length < 2) rawSlug = slugify(m.nomenclatura_text || `modelo-${m._id.slice(-4)}`)
    if (rawSlug.length < 2) rawSlug = `m-${m._id.slice(-6)}`
    const slug = uniqueSlug(rawSlug, usedSlugs)
    usedSlugs.add(slug)

    const amenities = (m.amenidades_list_custom_amenidadesproyecto ?? [])
      .map(id => amenityNames.get(id))
      .filter((n): n is string => !!n && n.length > 0)

    const { data, error } = await supabase
      .from('models')
      .insert({
        project_id: projectId,
        name,
        slug,
        size_m2: m.area_interna_number ?? null,
        bedrooms: m.habitaciones_number != null ? Math.round(m.habitaciones_number) : null,
        bathrooms: m.banios_number ?? null,
        parking_spots: m.parqueos_number != null ? Math.round(m.parqueos_number) : 0,
        price_from: m.precio_desde_usd_number ?? 0,
        monthly_payment_from: m.cuota_desde_usd_number ?? null,
        is_active: m.active_boolean ?? true,
        amenities,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Model insert failed [${name}]: ${error.message}`)
    await logMigration(m._id, data.id, 'models')
    inserted++
  }

  console.log(`  ✓ Models: ${inserted} inserted, ${skipped} skipped`)
}
