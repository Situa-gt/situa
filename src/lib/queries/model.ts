import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type MediaRow = Database['public']['Tables']['project_media']['Row']

export type ModelImage = Pick<
  MediaRow,
  'id' | 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height' | 'kind' | 'display_order'
>

export interface ModelDetailData {
  model: ModelRow
  project: Pick<
    ProjectRow,
    | 'id'
    | 'name'
    | 'slug'
    | 'short_description'
    | 'base_currency'
    | 'exchange_rate'
    | 'stage'
    | 'amenities'
    | 'latitude'
    | 'longitude'
    | 'google_maps_url'
  >
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
  images: ModelImage[]
  siblings: ModelRow[]
  siblingImages: Record<string, ModelImage>
  zone: { name: string; url_slug: string } | null
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
    { data: siblings, error: siblingsErr },
  ] = await Promise.all([
    supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('projects')
      .select(
        'id, name, slug, short_description, base_currency, exchange_rate, stage, amenities, latitude, longitude, google_maps_url, zones(name, url_slug)',
      )
      .eq('id', projectId)
      .eq('is_active', true)
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
      .neq('id', modelId)
      .order('display_order', { ascending: true })
      .order('price_from', { ascending: true }),
  ])

  if (modelErr) throw modelErr
  if (projectErr) throw projectErr
  if (mediaErr) throw mediaErr
  if (siblingsErr) throw siblingsErr
  if (!model || !project) return null

  const zoneRel = (project as unknown as { zones: { name: string; url_slug: string } | null }).zones
  const projectFields = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    short_description: project.short_description,
    base_currency: project.base_currency,
    exchange_rate: project.exchange_rate,
    stage: project.stage,
    amenities: project.amenities,
    latitude: project.latitude,
    longitude: project.longitude,
    google_maps_url: project.google_maps_url,
  }

  const allMedia = (media ?? []) as Array<ModelImage & { model_id: string | null }>
  const projectMedia = allMedia.filter((m) => m.model_id === null)
  const images: ModelImage[] = projectMedia.map((m) => ({
    id: m.id,
    url: m.url,
    url_md: m.url_md,
    url_sm: m.url_sm,
    alt: m.alt,
    blur_data_url: m.blur_data_url,
    width: m.width,
    height: m.height,
    kind: m.kind,
    display_order: m.display_order,
  }))
  const cover = images.find((m) => m.kind === 'cover') ?? null

  const siblingImages: Record<string, ModelImage> = {}
  for (const m of allMedia) {
    if (m.model_id && !siblingImages[m.model_id]) {
      const { model_id: _omit, ...rest } = m
      siblingImages[m.model_id] = rest
    }
  }

  return {
    model,
    project: projectFields,
    cover,
    images,
    siblings: siblings ?? [],
    siblingImages,
    zone: zoneRel ?? null,
  }
}

export function getModelDetail(
  modelId: string,
  projectId: string,
  modelSlug: string,
): Promise<ModelDetailData | null> {
  return unstable_cache(
    () => fetchModelDetail(modelId, projectId),
    ['model-detail-v5', modelId],
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
