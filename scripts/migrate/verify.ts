import { supabase } from './supabase-client'

async function count(table: string): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count ?? 0
}

async function spotCheckImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  console.log('\n=== Migration Verify ===\n')

  // ── Row counts ──────────────────────────────────────────────────────────────
  const tables = [
    'departments', 'municipalities', 'zones',
    'developers', 'projects', 'models',
    'project_media', 'legacy_redirects',
  ]

  for (const t of tables) {
    const n = await count(t)
    console.log(`  ${t.padEnd(20)} ${n}`)
  }

  // ── Null checks on required fields ─────────────────────────────────────────
  console.log('\n--- Null checks ---')

  const { data: projectsNoZone } = await supabase
    .from('projects').select('id, name').is('zone_id', null)
  if (projectsNoZone?.length) {
    console.warn(`  ⚠  ${projectsNoZone.length} projects with no zone_id`)
    projectsNoZone.forEach(p => console.warn(`     - ${p.name}`))
  } else {
    console.log('  ✓ All projects have zone_id')
  }

  const { data: modelsNoProject } = await supabase
    .from('models').select('id, name').is('project_id', null)
  if (modelsNoProject?.length) {
    console.warn(`  ⚠  ${modelsNoProject.length} models with no project_id`)
  } else {
    console.log('  ✓ All models have project_id')
  }

  const { data: projectsNoMedia } = await supabase
    .from('projects')
    .select('id, name')
    .not('id', 'in', `(select distinct project_id from project_media where kind = 'cover')`)
  if (projectsNoMedia?.length) {
    console.warn(`  ⚠  ${projectsNoMedia.length} projects with no cover image`)
    projectsNoMedia.forEach(p => console.warn(`     - ${p.name}`))
  } else {
    console.log('  ✓ All projects have a cover image')
  }

  // ── Spot-check 5 random image URLs ─────────────────────────────────────────
  console.log('\n--- Image URL spot check ---')

  const { data: mediaRows } = await supabase
    .from('project_media')
    .select('url, kind')
    .limit(5)

  for (const row of mediaRows ?? []) {
    const ok = await spotCheckImage(row.url)
    console.log(`  ${ok ? '✓' : '✗'} [${row.kind}] ${row.url.slice(0, 80)}...`)
  }

  // ── is_active summary ───────────────────────────────────────────────────────
  console.log('\n--- Active status ---')

  const { count: activeProjects } = await supabase
    .from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const { count: inactiveProjects } = await supabase
    .from('projects').select('*', { count: 'exact', head: true }).eq('is_active', false)

  console.log(`  Projects active:   ${activeProjects}`)
  console.log(`  Projects inactive: ${inactiveProjects}`)

  console.log('\n✅ Verify complete')
}

main().catch(err => {
  console.error('Verify failed:', err)
  process.exit(1)
})
