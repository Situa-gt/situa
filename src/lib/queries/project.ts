import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ModelRow = Database['public']['Tables']['models']['Row']
type DeveloperRow = Database['public']['Tables']['developers']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

export interface ProjectDetailData {
  project: ProjectRow
  developer: Pick<DeveloperRow, 'id' | 'name' | 'slug' | 'website'> | null
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
  models: ModelRow[]
  price_from: number | null
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
    { data: covers, error: coverErr },
    { data: models, error: modelsErr },
  ] = await Promise.all([
    supabase
      .from('developers')
      .select('id, name, slug, website')
      .eq('id', project.developer_id)
      .maybeSingle(),
    supabase
      .from('project_media')
      .select('url, url_md, url_sm, alt, blur_data_url, width, height, display_order')
      .eq('project_id', projectId)
      .eq('kind', 'cover')
      .order('display_order', { ascending: true })
      .limit(1),
    supabase
      .from('models')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('price_from', { ascending: true }),
  ])
  if (devErr) throw devErr
  if (coverErr) throw coverErr
  if (modelsErr) throw modelsErr

  const cover = covers && covers.length > 0 ? covers[0] : null

  const price_from =
    models && models.length > 0
      ? models.reduce<number | null>(
          (min, m) => (min === null || m.price_from < min ? m.price_from : min),
          null,
        )
      : null

  return {
    project,
    developer: developer ?? null,
    cover,
    models: models ?? [],
    price_from,
  }
}

export function getProjectDetail(
  projectId: string,
  projectSlug: string,
): Promise<ProjectDetailData | null> {
  return unstable_cache(
    () => fetchProjectDetail(projectId),
    ['project-detail', projectId],
    {
      tags: ['projects:active', `project:${projectSlug}`, `project-id:${projectId}`],
      revalidate: 3600,
    },
  )()
}
