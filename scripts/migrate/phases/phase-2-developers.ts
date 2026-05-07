import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { logMigration, getSupabaseId } from '../migration-log'
import { slugify, uniqueSlug } from '../slugify'

interface BDev {
  _id: string
  nombre_text: string
  email_text?: string
  logo_image?: string
  active_boolean?: boolean
}

export async function runPhase2() {
  console.log('\n=== Phase 2: Developers ===')

  const devs = await fetchAll<BDev>('Desarrolladores')
  console.log(`  ${devs.length} developers`)

  const usedSlugs = new Set<string>()

  for (const d of devs) {
    if (await getSupabaseId(d._id, 'developers')) continue

    const slug = uniqueSlug(slugify(d.nombre_text), usedSlugs)
    usedSlugs.add(slug)

    const { data, error } = await supabase
      .from('developers')
      .insert({
        name: d.nombre_text,
        slug,
        contact_email: d.email_text ?? null,
        is_active: d.active_boolean ?? true,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Developer insert failed [${d.nombre_text}]: ${error.message}`)
    await logMigration(d._id, data.id, 'developers')
    console.log(`  + ${d.nombre_text}`)
  }

  console.log('  ✓ Developers')
}
