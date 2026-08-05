import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { ProjectAmenityItem } from '@/components/project/ProjectAmenities'

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
  developer: { id: string; name: string } | null
  cover: Pick<MediaRow, 'url' | 'url_md' | 'url_sm' | 'alt' | 'blur_data_url' | 'width' | 'height'> | null
  images: ModelImage[]
  floorplan: ModelImage | null
  projectLogo: string | null
  developerLogo: string | null
  siblings: ModelRow[]
  siblingImages: Record<string, ModelImage>
  zone: { name: string; url_slug: string } | null
  amenities: ProjectAmenityItem[]
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
    projectAmenitiesResult,
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
        'id, name, slug, short_description, base_currency, exchange_rate, stage, amenities, latitude, longitude, google_maps_url, developers(id, name), zones(name, url_slug)',
      )
      .eq('id', projectId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('project_media')
      .select('id, url, url_md, url_sm, alt, blur_data_url, width, height, kind, display_order, model_id')
      .eq('project_id', projectId)
      .in('kind', ['cover', 'gallery', 'floorplan'])
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
    supabase
      .from('project_amenities')
      .select('display_order, amenities(name, icon)')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true }),
  ])

  if (modelErr) throw modelErr
  if (projectErr) throw projectErr
  if (mediaErr) throw mediaErr
  if (siblingsErr) throw siblingsErr
  if (!model || !project) return null

  const projectRaw = project as unknown as {
    developers: { id: string; name: string } | null
    zones: { name: string; url_slug: string } | null
  }
  const developer = projectRaw.developers ?? null
  const zoneRel = projectRaw.zones ?? null
  const projectAmenities: ProjectAmenityItem[] = projectAmenitiesResult.error
    ? []
    : (projectAmenitiesResult.data ?? []).map((item) => {
        const amenity = Array.isArray(item.amenities) ? item.amenities[0] : item.amenities
        return amenity ? { name: amenity.name, icon: amenity.icon } : null
      }).filter(Boolean) as ProjectAmenityItem[]

  const [{ data: projectLogoRow }, developerLogoData] = await Promise.all([
    supabase
      .from('project_media')
      .select('url')
      .eq('project_id', projectId)
      .eq('kind', 'logo')
      .maybeSingle(),
    developer?.id
      ? supabase
          .from('project_media')
          .select('url')
          .eq('developer_id', developer.id)
          .eq('kind', 'logo')
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ])

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

  // Gallery for this model only (cover + gallery kinds, not floorplan — that gets its own section)
  const thisModelMedia = allMedia.filter(
    (m) => m.model_id === modelId && (m.kind === 'cover' || m.kind === 'gallery'),
  )
  const images: ModelImage[] = thisModelMedia.map(({ model_id: _omit, ...rest }) => rest)
  const cover = images.find((m) => m.kind === 'cover') ?? null

  // Floorplan for this model
  const floorplanItem = allMedia.find((m) => m.model_id === modelId && m.kind === 'floorplan')
  const floorplan: ModelImage | null = floorplanItem
    ? (({ model_id: _omit, ...rest }) => rest)(floorplanItem)
    : null

  // Sibling card images: prefer floorplan, fallback to gallery
  const siblingImages: Record<string, ModelImage> = {}
  for (const m of allMedia) {
    if (m.model_id && m.kind === 'floorplan' && !siblingImages[m.model_id]) {
      const { model_id: _omit, ...rest } = m
      siblingImages[m.model_id] = rest
    }
  }
  for (const m of allMedia) {
    if (m.model_id && m.kind === 'gallery' && !siblingImages[m.model_id]) {
      const { model_id: _omit, ...rest } = m
      siblingImages[m.model_id] = rest
    }
  }

  return {
    model,
    project: projectFields,
    developer,
    cover,
    images,
    floorplan,
    projectLogo: projectLogoRow?.url ?? null,
    developerLogo: developerLogoData?.url ?? null,
    siblings: siblings ?? [],
    siblingImages,
    zone: zoneRel ?? null,
    amenities: projectAmenities.length > 0
      ? projectAmenities
      : (project.amenities ?? []).map((name) => ({ name })),
  }
}

export function getModelDetail(
  modelId: string,
  projectId: string,
  modelSlug: string,
): Promise<ModelDetailData | null> {
  return unstable_cache(
    () => fetchModelDetail(modelId, projectId),
    ['model-detail-v7', modelId],
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
