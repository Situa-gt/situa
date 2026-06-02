import { fetchOne, fetchFiltered } from './bubble-client'
import { supabase } from './supabase-client'
import { processAndUpload, withPool } from './image-processor'
import { bubbleImageUrl } from './mappers'

const MEDIA_LOG_TABLE = 'project_media_processed'
const PROJECT_LOGO_LOG = 'project_logo_processed'

interface BBubbleProject {
  _id: string
  cover_image?: string
  gallery_list_image?: string[]
  logo_image?: string
}

interface BBubbleModel {
  _id: string
  plano_image?: string
  gallery_list_image?: string[]
  proyecto_custom_proyectos?: string
}

function getProjectArg(): string {
  const idx = process.argv.indexOf('--project')
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error('Usage: npm run migrate:refresh-media -- --project <supabase-project-id>')
    process.exit(1)
  }
  return process.argv[idx + 1]
}

async function main() {
  const projectId = getProjectArg()
  console.log(`\n🔄 Media refresh for project: ${projectId}`)

  // 1. Reverse-lookup: Supabase project ID → Bubble project ID
  const { data: logRow, error: logErr } = await supabase
    .from('bubble_migration_log')
    .select('bubble_id')
    .eq('supabase_id', projectId)
    .eq('table_name', 'projects')
    .single()

  if (logErr || !logRow) {
    throw new Error(`No migration log entry found for project ${projectId}. Is the ID correct?`)
  }
  const bubbleProjectId = logRow.bubble_id
  console.log(`  Bubble project ID: ${bubbleProjectId}`)

  // 2. Fetch project and models from Bubble in parallel
  const [bubbleProject, bubbleModels] = await Promise.all([
    fetchOne<BBubbleProject>('Proyectos', bubbleProjectId),
    fetchFiltered<BBubbleModel>('Modelos', 'projeto_custom_proyectos', bubbleProjectId),
  ])
  console.log(`  ${bubbleModels.length} model(s) found in Bubble`)

  // 3. Get project info from Supabase for storage path construction
  const { data: projectRow, error: projErr } = await supabase
    .from('projects')
    .select('id, slug, property_type, zones(url_slug)')
    .eq('id', projectId)
    .single()

  if (projErr || !projectRow) throw new Error(`Project ${projectId} not found in Supabase`)

  const zone = Array.isArray(projectRow.zones)
    ? null
    : (projectRow.zones as { url_slug: string } | null)
  if (!zone) throw new Error(`Project ${projectId} has no zone`)

  const typeSlug = projectRow.property_type === 'casa' ? 'casas' : 'apartamentos'
  const projectBase = `${zone.url_slug}/${typeSlug}/${projectRow.slug}`

  // 4. Get model slugs and Bubble↔Supabase model ID mapping
  const { data: modelRows } = await supabase
    .from('models')
    .select('id, slug')
    .eq('project_id', projectId)

  const modelSlugMap = new Map((modelRows ?? []).map(r => [r.id, r.slug]))
  const supabaseModelIds = (modelRows ?? []).map(r => r.id)

  const { data: modelLogRows } = await supabase
    .from('bubble_migration_log')
    .select('bubble_id, supabase_id')
    .in('supabase_id', supabaseModelIds.length > 0 ? supabaseModelIds : ['__none__'])
    .eq('table_name', 'models')

  const bubbleToSupabaseModel = new Map(
    (modelLogRows ?? []).map(r => [r.bubble_id, r.supabase_id]),
  )

  // 5. Delete all existing project_media rows for this project (covers cover, gallery, logo,
  //    model floorplans, and model gallery — but not developer logos which have project_id = NULL)
  console.log('\n  Deleting existing media rows...')
  const { error: delErr } = await supabase
    .from('project_media')
    .delete()
    .eq('project_id', projectId)

  if (delErr) throw new Error(`Media delete failed: ${delErr.message}`)

  // 6. Clear migration log entries so phase-5 idempotency guard doesn't block re-processing
  console.log('  Clearing migration log entries...')

  await supabase
    .from('bubble_migration_log')
    .delete()
    .eq('bubble_id', bubbleProjectId)
    .in('table_name', [MEDIA_LOG_TABLE, PROJECT_LOGO_LOG])

  const bubbleModelIds = [...bubbleToSupabaseModel.keys()]
  if (bubbleModelIds.length > 0) {
    await supabase
      .from('bubble_migration_log')
      .delete()
      .in('bubble_id', bubbleModelIds)
      .eq('table_name', MEDIA_LOG_TABLE)
  }

  // 7. Re-upload project cover
  console.log('\n  Uploading project images...')
  const coverUrl = bubbleImageUrl(bubbleProject.cover_image)
  if (coverUrl) {
    const result = await processAndUpload(coverUrl, `${projectBase}/cover/cover`)
    const { error } = await supabase.from('project_media').insert({
      project_id: projectId,
      kind: 'cover',
      display_order: 0,
      ...result,
      alt: `Foto de ${projectRow.slug}`,
    })
    if (error) throw new Error(`Cover insert failed: ${error.message}`)
    console.log('    ✓ cover')
  } else {
    console.log('    – no cover image in Bubble')
  }

  // 8. Re-upload project gallery
  const gallery = (bubbleProject.gallery_list_image ?? []).map(bubbleImageUrl).filter(Boolean) as string[]
  for (let i = 0; i < gallery.length; i++) {
    const result = await processAndUpload(gallery[i], `${projectBase}/gallery/${i}`)
    const { error } = await supabase.from('project_media').insert({
      project_id: projectId,
      kind: 'gallery',
      display_order: i,
      ...result,
      alt: `Galería ${projectRow.slug} ${i + 1}`,
    })
    if (error) throw new Error(`Gallery insert failed [${i}]: ${error.message}`)
  }
  if (gallery.length > 0) console.log(`    ✓ gallery (${gallery.length} images)`)

  // 9. Re-upload project logo
  const logoUrl = bubbleImageUrl(bubbleProject.logo_image)
  if (logoUrl) {
    const result = await processAndUpload(logoUrl, `${projectBase}/logo/logo`)
    const { error } = await supabase.from('project_media').insert({
      project_id: projectId,
      developer_id: null,
      kind: 'logo',
      display_order: 0,
      ...result,
      alt: `Logo de ${projectRow.slug}`,
    })
    if (error) throw new Error(`Logo insert failed: ${error.message}`)
    console.log('    ✓ logo')
  }

  // 10. Re-upload model floorplans and galleries
  if (bubbleModels.length > 0) {
    console.log(`\n  Uploading model media...`)

    await withPool(bubbleModels, 4, async (m) => {
      const supabaseModelId = bubbleToSupabaseModel.get(m._id)
      if (!supabaseModelId) {
        console.warn(`  ⚠  No Supabase ID for Bubble model ${m._id}, skipping`)
        return
      }

      const modelSlug = modelSlugMap.get(supabaseModelId)
      if (!modelSlug) return

      const modelBase = `${projectBase}/models/${modelSlug}`

      const planoUrl = bubbleImageUrl(m.plano_image)
      if (planoUrl) {
        const result = await processAndUpload(planoUrl, `${modelBase}/floorplan/0`)
        const { error } = await supabase.from('project_media').insert({
          project_id: projectId,
          model_id: supabaseModelId,
          kind: 'floorplan',
          display_order: 0,
          ...result,
          alt: `Plano ${modelSlug}`,
        })
        if (error) throw new Error(`Floorplan insert failed [${modelSlug}]: ${error.message}`)
      }

      const modelGallery = (m.gallery_list_image ?? []).map(bubbleImageUrl).filter(Boolean) as string[]
      for (let i = 0; i < modelGallery.length; i++) {
        const result = await processAndUpload(modelGallery[i], `${modelBase}/gallery/${i}`)
        const { error } = await supabase.from('project_media').insert({
          project_id: projectId,
          model_id: supabaseModelId,
          kind: 'gallery',
          display_order: i,
          ...result,
          alt: `Galería modelo ${modelSlug} ${i + 1}`,
        })
        if (error) throw new Error(`Model gallery insert failed [${modelSlug}/${i}]: ${error.message}`)
      }

      console.log(`    ✓ ${modelSlug}`)
    })
  }

  console.log('\n✅ Media refresh complete')
}

main().catch(err => {
  console.error('\n❌ Media refresh failed:', err)
  process.exit(1)
})
