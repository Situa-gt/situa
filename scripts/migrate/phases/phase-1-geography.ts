import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { logMigration, getSupabaseId, buildIdMap } from '../migration-log'
import { slugify, uniqueSlug } from '../slugify'

interface BDept  { _id: string; nombre_text: string }
interface BMuni  { _id: string; nombre_text: string; departamento_custom_gt_departamentos: string }
interface BZona  { _id: string; nombre_text: string; numero_number: number }

export async function runPhase1() {
  console.log('\n=== Phase 1: Geography ===')

  // ── Departments ─────────────────────────────────────────────────────────────
  const depts = await fetchAll<BDept>('Gt_departamentos')
  console.log(`  ${depts.length} departments`)
  const usedDeptSlugs = new Set<string>()

  for (const d of depts) {
    if (await getSupabaseId(d._id, 'departments')) continue

    const slug = uniqueSlug(slugify(d.nombre_text), usedDeptSlugs)
    usedDeptSlugs.add(slug)

    const { data, error } = await supabase
      .from('departments')
      .insert({ name: d.nombre_text, slug })
      .select('id')
      .single()

    if (error) throw new Error(`Department insert failed [${d.nombre_text}]: ${error.message}`)
    await logMigration(d._id, data.id, 'departments')
  }
  console.log('  ✓ Departments')

  // ── Municipalities ────────────────────────────────────────────────────────
  const munis = await fetchAll<BMuni>('Gt_municipios')
  console.log(`  ${munis.length} municipalities`)
  const deptMap = await buildIdMap('departments')
  // track slug uniqueness per department
  const muniSlugsByDept = new Map<string, Set<string>>()

  for (const m of munis) {
    if (await getSupabaseId(m._id, 'municipalities')) continue

    const departmentId = deptMap.get(m.departamento_custom_gt_departamentos)
    if (!departmentId) {
      console.warn(`  ⚠  No dept for municipality "${m.nombre_text}" (${m.departamento_custom_gt_departamentos}), skipping`)
      continue
    }

    if (!muniSlugsByDept.has(departmentId)) muniSlugsByDept.set(departmentId, new Set())
    const used = muniSlugsByDept.get(departmentId)!
    const slug = uniqueSlug(slugify(m.nombre_text), used)
    used.add(slug)

    const { data, error } = await supabase
      .from('municipalities')
      .insert({ name: m.nombre_text, slug, department_id: departmentId })
      .select('id')
      .single()

    if (error) throw new Error(`Municipality insert failed [${m.nombre_text}]: ${error.message}`)
    await logMigration(m._id, data.id, 'municipalities')
  }
  console.log('  ✓ Municipalities')

  // ── Zones (all Guatemala City) ────────────────────────────────────────────
  // Find "Guatemala" dept then "Guatemala" municipality (the city)
  const { data: gDept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', 'Guatemala')
    .single()
  if (!gDept) throw new Error('Guatemala department not found after insert')

  const { data: gCity } = await supabase
    .from('municipalities')
    .select('id')
    .eq('department_id', gDept.id)
    .eq('name', 'Guatemala')
    .maybeSingle()
  if (!gCity) throw new Error('Guatemala City municipality not found after insert')

  const zonas = await fetchAll<BZona>('ZON_Zonas')
  console.log(`  ${zonas.length} zones`)
  const usedZoneSlugs = new Set<string>()

  for (const z of zonas) {
    if (await getSupabaseId(z._id, 'zones')) continue

    const base = slugify(z.nombre_text)          // e.g. zona-10
    const slug = uniqueSlug(base, usedZoneSlugs)
    usedZoneSlugs.add(slug)

    const { data, error } = await supabase
      .from('zones')
      .insert({
        municipality_id: gCity.id,
        name: z.nombre_text,
        slug,
        url_slug: slug,
        is_canonical_for_slug: true,
        display_order: z.numero_number,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Zone insert failed [${z.nombre_text}]: ${error.message}`)
    await logMigration(z._id, data.id, 'zones')
  }
  console.log('  ✓ Zones')
}
