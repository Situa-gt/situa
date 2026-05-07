import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

export interface ModelDetailData {
  model: ModelRow
  project: Pick<
    ProjectRow,
    'id' | 'name' | 'slug' | 'short_description' | 'base_currency' | 'exchange_rate' | 'stage'
  >
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
}

async function fetchModelDetail(
  modelId: string,
  projectId: string,
): Promise<ModelDetailData | null> {
  const supabase = createServerClient()

  const [
    { data: model, error: modelErr },
    { data: project, error: projectErr },
    { data: covers, error: coverErr },
  ] = await Promise.all([
    supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('projects')
      .select('id, name, slug, short_description, base_currency, exchange_rate, stage')
      .eq('id', projectId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('project_media')
      .select('url, url_md, url_sm, alt, blur_data_url, width, height')
      .eq('project_id', projectId)
      .eq('kind', 'cover')
      .order('display_order', { ascending: true })
      .limit(1),
  ])

  if (modelErr) throw modelErr
  if (projectErr) throw projectErr
  if (coverErr) throw coverErr
  if (!model || !project) return null

  return {
    model,
    project,
    cover: covers && covers.length > 0 ? covers[0] : null,
  }
}

export function getModelDetail(
  modelId: string,
  projectId: string,
  modelSlug: string,
): Promise<ModelDetailData | null> {
  return unstable_cache(
    () => fetchModelDetail(modelId, projectId),
    ['model-detail', modelId],
    {
      tags: [
        'models:active',
        `model:${modelSlug}`,
        `model-id:${modelId}`,
        `project-id:${projectId}`,
      ],
      revalidate: 3600,
    },
  )()
}
