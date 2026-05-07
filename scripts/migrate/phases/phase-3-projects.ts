import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { logMigration, getSupabaseId, buildIdMap } from '../migration-log'
import { slugify, uniqueSlug } from '../slugify'
import { mapPropertyType, mapStage, mapCurrency, mapProjectStatus } from '../mappers'

interface BProject {
  _id: string
  nombre_text: string
  Slug?: string
  descripcion_corta_text?: string
  zona_custom_zonas?: string
  desarrollador_custom_desarrollador?: string
  tipo_custom_tipoproyectos?: string
  estadoavanceproyecto_option_os_estadoavanceproyecto?: string
  estadoproyectopublicacion_option_os_estadoproyectopublicacion?: string
  moneda_comercializacion_option_os_monedas?: string
  tipo_cambio_number?: number
  latitud1_text?: string
  longitud_text?: string
  direccion_text?: string
  amenidades_list_custom_amenidadesproyecto?: string[]
}

interface BAmenidadProyecto {
  _id: string
  description_text?: string
}

export async function runPhase3() {
  console.log('\n=== Phase 3: Projects ===')

  const projects = await fetchAll<BProject>('Proyectos')
  console.log(`  ${projects.length} projects`)

  // Build amenity name lookup: amenidadProyecto _id → description_text
  const amenidadesProyecto = await fetchAll<BAmenidadProyecto>('AmenidadesProyecto')
  const amenityNames = new Map(amenidadesProyecto.map(a => [a._id, a.description_text ?? '']))

  const zoneMap = await buildIdMap('zones')
  const devMap = await buildIdMap('developers')

  // Track slugs per zone for uniqueness
  const slugsByZone = new Map<string, Set<string>>()

  let inserted = 0
  let skipped = 0

  for (const p of projects) {
    if (await getSupabaseId(p._id, 'projects')) { skipped++; continue }

    const zoneId = p.zona_custom_zonas ? zoneMap.get(p.zona_custom_zonas) : null
    const developerId = p.desarrollador_custom_desarrollador
      ? devMap.get(p.desarrollador_custom_desarrollador)
      : null

    if (!zoneId) {
      console.warn(`  ⚠  Project "${p.nombre_text}" has no zone, skipping`)
      skipped++
      continue
    }
    if (!developerId) {
      console.warn(`  ⚠  Project "${p.nombre_text}" has no developer, skipping`)
      skipped++
      continue
    }

    if (!slugsByZone.has(zoneId)) slugsByZone.set(zoneId, new Set())
    const usedSlugs = slugsByZone.get(zoneId)!
    const slug = uniqueSlug(slugify(p.nombre_text), usedSlugs)
    usedSlugs.add(slug)

    // Resolve amenity names
    const amenities = (p.amenidades_list_custom_amenidadesproyecto ?? [])
      .map(id => amenityNames.get(id))
      .filter((n): n is string => !!n && n.length > 0)

    // Coords
    const latitude = p.latitud1_text ? parseFloat(p.latitud1_text) : null
    const longitude = p.longitud_text ? parseFloat(p.longitud_text) : null

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: p.nombre_text,
        slug,
        legacy_slugs: p.Slug ? [p.Slug] : [],
        description: p.descripcion_corta_text ?? null,
        short_description: p.descripcion_corta_text ?? null,
        zone_id: zoneId,
        developer_id: developerId,
        property_type: mapPropertyType(p.tipo_custom_tipoproyectos ?? ''),
        stage: mapStage(p.estadoavanceproyecto_option_os_estadoavanceproyecto ?? ''),
        is_active: mapProjectStatus(
          p.estadoproyectopublicacion_option_os_estadoproyectopublicacion ?? '',
        ),
        base_currency: mapCurrency(p.moneda_comercializacion_option_os_monedas ?? ''),
        exchange_rate: p.tipo_cambio_number ?? 7.7,
        latitude: latitude && !isNaN(latitude) ? latitude : null,
        longitude: longitude && !isNaN(longitude) ? longitude : null,
        google_maps_url: null, // Bubble only has address text, not a maps URL
        amenities,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Project insert failed [${p.nombre_text}]: ${error.message}`)
    await logMigration(p._id, data.id, 'projects')
    inserted++
    console.log(`  + ${p.nombre_text} (${slug})`)
  }

  console.log(`  ✓ Projects: ${inserted} inserted, ${skipped} skipped`)
}
