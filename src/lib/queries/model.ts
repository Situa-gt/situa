import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

export type ModelImage = Pick<
  MediaRow,
  'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height' | 'kind'
>

export interface ModelDetailData {
  model: ModelRow
  project: Pick<
    ProjectRow,
    'id' | 'name' | 'slug' | 'short_description' | 'base_currency' | 'exchange_rate' | 'stage'
  >
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
  images: ModelImage[]
}

async function fetchModelDetail(
  modelId: string,
  projectId: string,
): Promise<ModelDetailData | null> {
  const supabase = createServerClient()

  const [
    { data: model, error: modelErr },
    { data: project, error: projectErr },
    { data: media, error: mediaErr },
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
      .select('url, url_md, url_sm, alt, blur_data_url, width, height, kind, display_order')
      .eq('project_id', projectId)
      .in('kind', ['cover', 'gallery'])
      .order('kind', { ascending: true })
      .order('display_order', { ascending: true }),
  ])

  if (modelErr) throw modelErr
  if (projectErr) throw projectErr
  if (mediaErr) throw mediaErr
  if (!model || !project) return null

  const images: ModelImage[] = (media ?? []).map((m) => ({
    url: m.url,
    url_md: m.url_md,
    url_sm: m.url_sm,
    alt: m.alt,
    blur_data_url: m.blur_data_url,
    width: m.width,
    height: m.height,
    kind: m.kind,
  }))
  const cover = images.find((m) => m.kind === 'cover') ?? null

  return {
    model,
    project,
    cover,
    images,
  }
}

export function getModelDetail(
  modelId: string,
  projectId: string,
  modelSlug: string,
): Promise<ModelDetailData | null> {
  return unstable_cache(
    () => fetchModelDetail(modelId, projectId),
    ['model-detail-v2', modelId],
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
