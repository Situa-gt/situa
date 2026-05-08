import { fetchAll } from '../bubble-client'
import { supabase } from '../supabase-client'
import { logMigration, getSupabaseId, buildIdMap } from '../migration-log'
import { processAndUpload, withPool } from '../image-processor'
import { bubbleImageUrl } from '../mappers'

interface BProject {
  _id: string
  cover_image?: string
  gallery_list_image?: string[]
  logo_image?: string
}

interface BModel {
  _id: string
  plano_image?: string
  gallery_list_image?: string[]
  proyecto_custom_proyectos?: string
}

interface BDev {
  _id: string
  logo_image?: string
}

// Key in migration log for tracking which entities had media processed
const MEDIA_LOG_TABLE = 'project_media_processed'

export async function runPhase5() {
  console.log('\n=== Phase 5: Media ===')

  const [projects, models, devs, projectMap, modelMap, devMap] = await Promise.all([
    fetchAll<BProject>('Proyectos'),
    fetchAll<BModel>('Modelos'),
    fetchAll<BDev>('Desarrolladores'),
    buildIdMap('projects'),
    buildIdMap('models'),
    buildIdMap('developers'),
  ])

  // Need zone slug + project slug to build storage paths
  // Fetch from Supabase to get slug + zone url_slug
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, slug, zone_id, zones(url_slug), property_type')

  const projectSlugMap = new Map<string, { slug: string; zoneSlug: string; type: string }>()
  for (const row of projectRows ?? []) {
    const zone = Array.isArray(row.zones) ? null : (row.zones as { url_slug: string } | null)
    if (zone) {
      projectSlugMap.set(row.id, {
        slug: row.slug,
        zoneSlug: zone.url_slug,
        type: row.property_type,
      })
    }
  }

  const { data: modelRows } = await supabase.from('models').select('id, slug, project_id')
  const modelSlugMap = new Map<string, { slug: string; projectId: string }>()
  for (const row of modelRows ?? []) {
    modelSlugMap.set(row.id, { slug: row.slug, projectId: row.project_id })
  }

  const { data: devRows } = await supabase.from('developers').select('id, slug')
  const devSlugMap = new Map<string, string>()
  for (const row of devRows ?? []) devSlugMap.set(row.id, row.slug)

  // ── Project covers + gallery ───────────────────────────────────────────────
  console.log(`  Processing ${projects.length} projects...`)

  await withPool(projects, 4, async (p) => {
    const projectId = projectMap.get(p._id)
    if (!projectId) return

    if (await getSupabaseId(p._id, MEDIA_LOG_TABLE)) return

    const info = projectSlugMap.get(projectId)
    if (!info) return

    const typeSlug = info.type === 'casa' ? 'casas' : 'apartamentos'
    const base = `${info.zoneSlug}/${typeSlug}/${info.slug}`

    try {
      // Cover
      const coverUrl = bubbleImageUrl(p.cover_image)
      if (coverUrl) {
        const result = await processAndUpload(coverUrl, `${base}/cover/cover`)
        await supabase.from('project_media').insert({
          project_id: projectId,
          kind: 'cover',
          display_order: 0,
          ...result,
          alt: `Foto de ${info.slug}`,
        })
      }

      // Gallery
      const gallery = (p.gallery_list_image ?? []).map(bubbleImageUrl).filter(Boolean) as string[]
      for (let i = 0; i < gallery.length; i++) {
        const result = await processAndUpload(gallery[i], `${base}/gallery/${i}`)
        await supabase.from('project_media').insert({
          project_id: projectId,
          kind: 'gallery',
          display_order: i,
          ...result,
          alt: `Galería ${info.slug} ${i + 1}`,
        })
      }

      await logMigration(p._id, projectId, MEDIA_LOG_TABLE)
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n  ✗ Project media failed [${info.slug}]: ${(err as Error).message}`)
    }
  })

  console.log('\n  ✓ Project media')

  // ── Model floorplans + gallery ─────────────────────────────────────────────
  console.log(`  Processing ${models.length} models...`)

  await withPool(models, 4, async (m) => {
    const modelId = modelMap.get(m._id)
    if (!modelId) return

    if (await getSupabaseId(m._id, MEDIA_LOG_TABLE)) return

    const projectId = m.proyecto_custom_proyectos ? projectMap.get(m.proyecto_custom_proyectos) : null
    if (!projectId) return

    const projectInfo = projectSlugMap.get(projectId)
    const modelInfo = modelSlugMap.get(modelId)
    if (!projectInfo || !modelInfo) return

    const typeSlug = projectInfo.type === 'casa' ? 'casas' : 'apartamentos'
    const base = `${projectInfo.zoneSlug}/${typeSlug}/${projectInfo.slug}/models/${modelInfo.slug}`

    try {
      // Floorplan
      const planoUrl = bubbleImageUrl(m.plano_image)
      if (planoUrl) {
        const result = await processAndUpload(planoUrl, `${base}/floorplan/0`)
        await supabase.from('project_media').insert({
          project_id: projectId,
          model_id: modelId,
          kind: 'floorplan',
          display_order: 0,
          ...result,
          alt: `Plano ${modelInfo.slug}`,
        })
      }

      // Model gallery
      const gallery = (m.gallery_list_image ?? []).map(bubbleImageUrl).filter(Boolean) as string[]
      for (let i = 0; i < gallery.length; i++) {
        const result = await processAndUpload(gallery[i], `${base}/gallery/${i}`)
        await supabase.from('project_media').insert({
          project_id: projectId,
          model_id: modelId,
          kind: 'gallery',
          display_order: i,
          ...result,
          alt: `Galería modelo ${modelInfo.slug} ${i + 1}`,
        })
      }

      await logMigration(m._id, modelId, MEDIA_LOG_TABLE)
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n  ✗ Model media failed [${modelInfo.slug}]: ${(err as Error).message}`)
    }
  })

  console.log('\n  ✓ Model media')

  // ── Developer logos ────────────────────────────────────────────────────────
  console.log(`  Processing ${devs.length} developer logos...`)

  await withPool(devs, 4, async (d) => {
    const devId = devMap.get(d._id)
    if (!devId) return

    if (await getSupabaseId(d._id, MEDIA_LOG_TABLE)) return

    const devSlug = devSlugMap.get(devId)
    if (!devSlug) return

    const logoUrl = bubbleImageUrl(d.logo_image)
    if (!logoUrl) return

    try {
      const result = await processAndUpload(logoUrl, `developers/${devSlug}/logo`)
      await supabase.from('project_media').insert({
        developer_id: devId,
        project_id: null,
        kind: 'logo',
        display_order: 0,
        ...result,
        alt: `Logo ${devSlug}`,
      })

      await logMigration(d._id, devId, MEDIA_LOG_TABLE)
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n  ✗ Developer logo failed [${devSlug}]: ${(err as Error).message}`)
    }
  })

  console.log('\n  ✓ Developer logos')

  // ── Project logos ──────────────────────────────────────────────────────────
  // Uses a separate log key so it runs independently of the cover/gallery migration
  const PROJECT_LOGO_LOG = 'project_logo_processed'
  console.log(`  Processing ${projects.length} project logos...`)

  await withPool(projects, 4, async (p) => {
    const projectId = projectMap.get(p._id)
    if (!projectId) return

    if (await getSupabaseId(p._id, PROJECT_LOGO_LOG)) return

    const logoUrl = bubbleImageUrl(p.logo_image)
    if (!logoUrl) {
      await logMigration(p._id, projectId, PROJECT_LOGO_LOG)
      return
    }

    const info = projectSlugMap.get(projectId)
    if (!info) return

    const typeSlug = info.type === 'casa' ? 'casas' : 'apartamentos'
    const base = `${info.zoneSlug}/${typeSlug}/${info.slug}`

    try {
      const result = await processAndUpload(logoUrl, `${base}/logo/logo`)
      await supabase.from('project_media').insert({
        project_id: projectId,
        developer_id: null,
        kind: 'logo',
        display_order: 0,
        ...result,
        alt: `Logo de ${info.slug}`,
      })

      await logMigration(p._id, projectId, PROJECT_LOGO_LOG)
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n  ✗ Project logo failed [${info.slug}]: ${(err as Error).message}`)
    }
  })

  console.log('\n  ✓ Project logos')
}
