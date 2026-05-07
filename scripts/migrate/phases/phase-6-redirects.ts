import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { buildIdMap } from '../migration-log'

interface BProject {
  _id: string
  Slug?: string
}

export async function runPhase6() {
  console.log('\n=== Phase 6: Legacy redirects ===')

  const projects = await fetchAll<BProject>('Proyectos')
  const projectMap = await buildIdMap('projects')

  // Fetch new slugs + zone url_slug + property_type for each project
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, slug, property_type, zones(url_slug)')

  const newPathMap = new Map<string, string>()
  for (const row of projectRows ?? []) {
    const zone = Array.isArray(row.zones) ? null : (row.zones as { url_slug: string } | null)
    if (!zone) continue
    const typeSlug = row.property_type === 'casa' ? 'casas' : 'apartamentos'
    newPathMap.set(row.id, `/${zone.url_slug}/${typeSlug}/${row.slug}`)
  }

  let inserted = 0

  for (const p of projects) {
    if (!p.Slug) continue

    const projectId = projectMap.get(p._id)
    if (!projectId) continue

    const newPath = newPathMap.get(projectId)
    if (!newPath) continue

    const oldPath = `/proyecto/${p.Slug}`
    if (oldPath === newPath) continue

    const { error } = await supabase
      .from('legacy_redirects')
      .upsert(
        { old_path: oldPath, new_path: newPath, status_code: 308 },
        { onConflict: 'old_path' },
      )

    if (error) {
      console.warn(`  ⚠  Redirect insert failed [${oldPath}]: ${error.message}`)
    } else {
      console.log(`  ${oldPath} → ${newPath}`)
      inserted++
    }
  }

  console.log(`  ✓ Redirects: ${inserted} inserted`)
}
