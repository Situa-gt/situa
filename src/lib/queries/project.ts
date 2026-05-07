import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ModelRow = Database['public']['Tables']['models']['Row']
type DeveloperRow = Database['public']['Tables']['developers']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

export type ProjectGalleryImage = Pick<
  MediaRow,
  'id' | 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height' | 'kind' | 'display_order'
>

export interface ProjectDetailData {
  project: ProjectRow
  developer: Pick<DeveloperRow, 'id' | 'name' | 'slug' | 'website'> | null
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
  gallery: ProjectGalleryImage[]
  models: ModelRow[]
  modelImages: Record<string, ProjectGalleryImage>
  price_from: number | null
  department: { name: string } | null
}

async function fetchProjectDetail(projectId: string): Promise<ProjectDetailData | null> {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!project) return null

  const [
    { data: developer, error: devErr },
    { data: media, error: mediaErr },
    { data: models, error: modelsErr },
    { data: zoneWithDept, error: zoneErr },
  ] = await Promise.all([
    supabase
      .from('developers')
      .select('id, name, slug, website')
      .eq('id', project.developer_id)
      .maybeSingle(),
    supabase
      .from('project_media')
      .select('id, url, url_md, url_sm, alt, blur_data_url, width, height, kind, display_order, model_id')
      .eq('project_id', projectId)
      .in('kind', ['cover', 'gallery'])
      .order('kind', { ascending: true })
      .order('display_order', { ascending: true }),
    supabase
      .from('models')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('price_from', { ascending: true }),
    supabase
      .from('zones')
      .select('municipalities(departments(name))')
      .eq('id', project.zone_id)
      .maybeSingle(),
  ])
  if (devErr) throw devErr
  if (mediaErr) throw mediaErr
  if (modelsErr) throw modelsErr
  if (zoneErr) throw zoneErr

  const allMedia = (media ?? []) as Array<ProjectGalleryImage & { model_id: string | null }>
  const projectMedia = allMedia.filter((m) => m.model_id === null)
  const modelMedia = allMedia.filter((m) => m.model_id !== null)
  const coverItem = projectMedia.find((m) => m.kind === 'cover') ?? null
  const galleryItems = projectMedia.filter((m) => m.kind === 'gallery')

  const modelImages: Record<string, ProjectGalleryImage> = {}
  for (const m of modelMedia) {
    if (m.model_id && !modelImages[m.model_id]) {
      const { model_id: _omit, ...rest } = m
      modelImages[m.model_id] = rest
    }
  }
  // Cover-first ordering, then gallery by display_order. Gallery used by the on-page gallery + modal.
  const gallery: ProjectGalleryImage[] = coverItem
    ? [coverItem, ...galleryItems]
    : galleryItems
  const cover = coverItem
    ? {
        url: coverItem.url,
        url_md: coverItem.url_md,
        url_sm: coverItem.url_sm,
        alt: coverItem.alt,
        blur_data_url: coverItem.blur_data_url,
        width: coverItem.width,
        height: coverItem.height,
      }
    : null

  const price_from =
    models && models.length > 0
      ? models.reduce<number | null>(
          (min, m) => (min === null || m.price_from < min ? m.price_from : min),
          null,
        )
      : null

  const muni = (zoneWithDept?.municipalities ?? null) as
    | { departments: { name: string } | null }
    | null
  const department = muni?.departments?.name ? { name: muni.departments.name } : null

  return {
    project,
    developer: developer ?? null,
    cover,
    gallery,
    models: models ?? [],
    modelImages,
    price_from,
    department,
  }
}

export function getProjectDetail(
  projectId: string,
  projectSlug: string,
): Promise<ProjectDetailData | null> {
  return unstable_cache(
    () => fetchProjectDetail(projectId),
    ['project-detail-v4', projectId],
    {
      tags: ['projects:active', `project:${projectSlug}`, `project-id:${projectId}`],
      revalidate: 3600,
    },
  )()
}
