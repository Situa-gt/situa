import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { resolveSlug, type Resolved } from '@/lib/resolve-slug'
import { tipoSlug } from '@/lib/types/property'
import { getProjectsForIndex } from '@/lib/queries/index-pages'
import { getProjectDetail } from '@/lib/queries/project'
import { getModelDetail } from '@/lib/queries/model'
import { getSuggestedProjects } from '@/lib/queries/suggestions'
import { formatPriceFrom } from '@/lib/format/price'
import { Breadcrumbs } from '@/components/breadcrumbs/Breadcrumbs'
import { IndexHero } from '@/components/index/IndexHero'
import { ProjectGrid } from '@/components/index/ProjectGrid'
import { ProjectHeaderInfo } from '@/components/project/ProjectHeader'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { ProjectMainDetails } from '@/components/project/ProjectMainDetails'
import { ProjectAmenities } from '@/components/project/ProjectAmenities'
import { ProjectLocation } from '@/components/project/ProjectLocation'
import { ProjectStatusTimeline } from '@/components/project/ProjectStatusTimeline'
import { ModelsGrid } from '@/components/project/ModelsGrid'
import { SuggestedProjects } from '@/components/project/SuggestedProjects'
import { ModelHeaderInfo } from '@/components/model/ModelHeader'
import { ModelMainDetails } from '@/components/model/ModelMainDetails'
import { ModelSpecs } from '@/components/model/ModelSpecs'
import { ModelFloorplan } from '@/components/model/ModelFloorplan'
import { ContactSidebar } from '@/components/contact/ContactSidebar'
import { ContactFloatingCta } from '@/components/contact/ContactFloatingCta'
import { JsonLd } from '@/components/seo/JsonLd'
import { ModelReadableSummary, ProjectReadableSummary } from '@/components/seo/ReadablePropertySummary'
import { TrackView } from '@/components/analytics/TrackView'
import { breadcrumbsFor, labelForTipo } from '@/lib/breadcrumbs'
import {
  buildBreadcrumbList,
  buildItemList,
  buildRealEstateListing,
  buildPlace,
  buildOrganizationDeveloper,
  buildProjectFaq,
  buildProjectOfferCatalog,
  buildProductWithOffer,
} from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/site'

export const dynamicParams = true
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string[] }>
}

function absoluteUrl(url: string | null | undefined) {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

function projectSeoDescription({
  projectName,
  zoneName,
  description,
  priceFrom,
  currency,
}: {
  projectName: string
  zoneName: string
  description?: string | null
  priceFrom?: number | null
  currency?: string
}) {
  const base =
    description && description.trim().length >= 90
      ? description.trim()
      : `${projectName} en ${zoneName}, Guatemala. Consulta modelos, precios, cuotas, amenidades, estado del proyecto y contacto directo con la desarrolladora.`
  const price = priceFrom !== null && priceFrom !== undefined && currency
    ? ` Precio desde ${currency} ${priceFrom.toLocaleString('es-GT')}.`
    : ''
  return `${base}${price}`.slice(0, 300)
}

export async function generateStaticParams() {
  const supabase = createServerClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('slug, property_type, zones(url_slug)')
    .eq('is_active', true)

  const tipoParams = [{ slug: ['apartamentos'] }]

  const projectsWithZone = (projects ?? []).filter(
    (p): p is typeof p & { zones: { url_slug: string } } => p.zones !== null,
  )

  // Only generate zone paths for zones that actually have active projects
  const zonesWithProjects = new Set(projectsWithZone.map((p) => p.zones.url_slug))
  const zoneParams = Array.from(zonesWithProjects).map((slug) => ({ slug: [slug] }))

  // Only generate /zona/apartamentos paths — casas index pages are removed
  const zoneTipoSet = new Set<string>()
  const zoneTipoParams = projectsWithZone
    .filter((p) => p.property_type === 'apartamento')
    .flatMap((p) => {
      const key = `${p.zones.url_slug}/apartamentos`
      if (zoneTipoSet.has(key)) return []
      zoneTipoSet.add(key)
      return [{ slug: [p.zones.url_slug, 'apartamentos'] }]
    })

  const projectParams = projectsWithZone.map((p) => ({
    slug: [p.zones.url_slug, tipoSlug(p.property_type), p.slug],
  }))

  const projectIds = projectsWithZone.map((p) => p.slug)
  const projectsBySlug = new Map(projectsWithZone.map((p) => [p.slug, p]))
  const { data: models } =
    projectIds.length > 0
      ? await supabase
          .from('models')
          .select('slug, project_id, projects!inner(slug, property_type, zones(url_slug))')
          .eq('is_active', true)
      : { data: [] as never[] }

  const modelParams = (models ?? [])
    .filter(
      (m): m is typeof m & {
        projects: { slug: string; property_type: 'apartamento' | 'casa'; zones: { url_slug: string } }
      } =>
        m.projects !== null && m.projects.zones !== null && projectsBySlug.has(m.projects.slug),
    )
    .map((m) => ({
      slug: [
        m.projects.zones.url_slug,
        tipoSlug(m.projects.property_type),
        m.projects.slug,
        m.slug,
      ],
    }))

  return [...tipoParams, ...zoneParams, ...zoneTipoParams, ...projectParams, ...modelParams]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const resolved = await resolveSlug(slug)

  if (resolved.kind === 'tipo' && resolved.data.tipo === 'casa') return { title: 'Página no encontrada | Sitúa' }
  if (resolved.kind === 'zone-tipo' && resolved.data.tipo === 'casa') return { title: 'Página no encontrada | Sitúa' }

  switch (resolved.kind) {
    case 'tipo':
      return {
        title: `${labelForTipo(resolved.data.tipo)} en preventa Guatemala | Sitúa`,
        description: `Explora todos los ${labelForTipo(resolved.data.tipo).toLowerCase()} en preventa y construcción en Guatemala. Compara proyectos, precios y modelos disponibles.`,
        alternates: { canonical: `/${tipoSlug(resolved.data.tipo)}` },
      }
    case 'zone':
      return {
        title: `Proyectos en ${resolved.data.zone.name} | Preventa Guatemala | Sitúa`,
        description: `Proyectos de apartamentos y casas en ${resolved.data.zone.name}, Guatemala. Preventa y construcción. Compara modelos, precios y amenidades.`,
        alternates: { canonical: `/${resolved.data.zone.url_slug}` },
      }
    case 'zone-tipo':
      return {
        title: `${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name} | Sitúa`,
        description: `${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name}, Guatemala. Proyectos en preventa, construcción y entrega inmediata. Contacta directamente al desarrollador.`,
        alternates: {
          canonical: `/${resolved.data.zone.url_slug}/${tipoSlug(resolved.data.tipo)}`,
        },
      }
    case 'project': {
      const { project, zone } = resolved.data
      const detail = await getProjectDetail(project.id, project.slug)
      const image = absoluteUrl(detail?.cover?.url_md ?? detail?.cover?.url)
      const title = `${project.name} en ${zone.name} | Sitúa`
      const description = projectSeoDescription({
        projectName: project.name,
        zoneName: zone.name,
        description: detail?.project.short_description ?? project.short_description,
        priceFrom: detail?.price_from,
        currency: detail?.project.base_currency,
      })
      return {
        title,
        description,
        alternates: {
          canonical: `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`,
        },
        openGraph: {
          title,
          description,
          type: 'website',
          ...(image
            ? {
                images: [
                  {
                    url: image,
                    width: detail?.cover?.width ?? 1200,
                    height: detail?.cover?.height ?? 630,
                    alt: detail?.cover?.alt ?? `Imagen principal de ${project.name}`,
                  },
                ],
              }
            : {}),
        },
        twitter: image
          ? {
              card: 'summary_large_image',
              title,
              description,
              images: [image],
            }
          : undefined,
      }
    }
    case 'model': {
      const { model, project, zone } = resolved.data
      const detail = await getModelDetail(model.id, project.id, model.slug)
      const image = absoluteUrl(
        detail?.cover?.url_md ??
          detail?.cover?.url ??
          detail?.floorplan?.url_md ??
          detail?.floorplan?.url,
      )
      const title = `${model.name} en ${project.name} | ${formatPriceFrom(model.price_from, project.base_currency)} | Sitúa`
      const description = projectSeoDescription({
        projectName: `${model.name} de ${project.name}`,
        zoneName: zone.name,
        description: detail?.model.description ?? detail?.project.short_description ?? project.short_description,
        priceFrom: detail?.model.price_from ?? model.price_from,
        currency: detail?.project.base_currency ?? project.base_currency,
      })
      return {
        title,
        description,
        alternates: {
          canonical: `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}/${model.slug}`,
        },
        openGraph: {
          title,
          description,
          type: 'website',
          ...(image
            ? {
                images: [
                  {
                    url: image,
                    width: detail?.cover?.width ?? detail?.floorplan?.width ?? 1200,
                    height: detail?.cover?.height ?? detail?.floorplan?.height ?? 630,
                    alt:
                      detail?.cover?.alt ??
                      detail?.floorplan?.alt ??
                      `${model.name} en ${project.name}`,
                  },
                ],
              }
            : {}),
        },
        twitter: image
          ? {
              card: 'summary_large_image',
              title,
              description,
              images: [image],
            }
          : undefined,
      }
    }
    case 'not-found':
      return { title: 'Página no encontrada | Sitúa' }
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolveSlug(slug)

  if (resolved.kind === 'not-found') notFound()
  if (resolved.kind === 'tipo' && resolved.data.tipo === 'casa') notFound()
  if (resolved.kind === 'zone-tipo' && resolved.data.tipo === 'casa') notFound()

  const { body, jsonLd } = await renderBody(resolved)
  const breadcrumbs = breadcrumbsFor(resolved)
  return (
    <main className="pb-20">
      <JsonLd data={[buildBreadcrumbList(breadcrumbs), ...jsonLd]} />
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      {body}
    </main>
  )
}

interface RenderResult {
  body: React.ReactNode
  jsonLd: object[]
}

async function renderBody(resolved: Exclude<Resolved, { kind: 'not-found' }>): Promise<RenderResult> {
  switch (resolved.kind) {
    case 'tipo': {
      const projects = await getProjectsForIndex({ tipo: resolved.data.tipo })
      return {
        body: (
          <>
            <IndexHero
              title={`${labelForTipo(resolved.data.tipo)} en Guatemala`}
              subtitle="Proyectos en preventa, construcción y entrega inmediata."
            />
            <ProjectGrid projects={projects} />
          </>
        ),
        jsonLd: [buildItemList(projects)],
      }
    }
    case 'zone': {
      const projects = await getProjectsForIndex({ zoneId: resolved.data.zone.id })
      return {
        body: (
          <>
            <IndexHero
              title={`Proyectos en ${resolved.data.zone.name}`}
              subtitle={`Proyectos en preventa y construcción en ${resolved.data.zone.name}. Contacta directamente al desarrollador.`}
            />
            <ProjectGrid projects={projects} />
          </>
        ),
        jsonLd: [buildItemList(projects)],
      }
    }
    case 'zone-tipo': {
      const projects = await getProjectsForIndex({
        tipo: resolved.data.tipo,
        zoneId: resolved.data.zone.id,
      })
      return {
        body: (
          <>
            <IndexHero
              title={`${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name}`}
              subtitle={`${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name}, Guatemala. Proyectos en preventa y construcción.`}
            />
            <ProjectGrid projects={projects} />
          </>
        ),
        jsonLd: [buildItemList(projects)],
      }
    }
    case 'project': {
      const { project, zone } = resolved.data
      const detail = await getProjectDetail(project.id, project.slug)
      if (!detail) notFound()
      const suggestedProjects = await getSuggestedProjects(project.id, 6)
      const basePath = `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
      const jsonLd: object[] = [
        buildRealEstateListing({ detail, zone, canonicalPath: basePath }),
        buildPlace({ detail, zone, canonicalPath: basePath }),
        buildProjectFaq({ detail, zone, canonicalPath: basePath }),
      ]
      const developerNode = buildOrganizationDeveloper(detail)
      if (developerNode) jsonLd.push(developerNode)
      const offerCatalogNode = buildProjectOfferCatalog({ detail, zone, canonicalPath: basePath })
      if (offerCatalogNode) jsonLd.push(offerCatalogNode)
      return {
        body: (
          <div className="mx-auto w-full max-w-7xl px-6">
            <TrackView type="project_view" projectId={detail.project.id} />
            <ContactFloatingCta />
            <div className="mt-8">
              <ProjectGallery
                images={detail.gallery}
                projectName={detail.project.name}
              />
            </div>
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-12">
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <ProjectHeaderInfo detail={detail} zoneName={zone.name} />
                <div className="mt-8">
                  <ProjectMainDetails
                    baseCurrency={detail.project.base_currency}
                    exchangeRate={detail.project.exchange_rate}
                    priceFrom={detail.price_from}
                    monthlyFrom={detail.monthly_payment_from}
                    models={detail.models}
                  />
                </div>
              </div>
              <ContactSidebar
                className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2"
                projectId={detail.project.id}
                projectName={detail.project.name}
                suggestedProjects={suggestedProjects}
              />
              <div className="order-3 flex flex-col gap-12 lg:col-start-1 lg:row-start-2">
                <ProjectReadableSummary
                  projectName={detail.project.name}
                  zoneName={zone.name}
                  developerName={detail.developer?.name}
                  stage={detail.project.stage}
                  currency={detail.project.base_currency}
                  priceFrom={detail.price_from}
                  monthlyFrom={detail.monthly_payment_from}
                  modelCount={detail.models.length}
                  amenities={detail.project.amenities}
                />
                <ModelsGrid
                  models={detail.models}
                  currency={project.base_currency}
                  basePath={basePath}
                  images={detail.modelImages}
                />
                <ProjectAmenities amenities={detail.project.amenities} />
                <ProjectLocation
                  latitude={detail.project.latitude}
                  longitude={detail.project.longitude}
                  googleMapsUrl={detail.project.google_maps_url}
                  zoneName={zone.name}
                  projectName={detail.project.name}
                />
                <ProjectStatusTimeline current={detail.project.stage} />
                <SuggestedProjects sourceProjectId={detail.project.id} projects={suggestedProjects} />
              </div>
            </div>
          </div>
        ),
        jsonLd,
      }
    }
    case 'model': {
      const { model, project, zone } = resolved.data
      const detail = await getModelDetail(model.id, project.id, model.slug)
      if (!detail) notFound()
      const suggestedProjects = await getSuggestedProjects(project.id, 6)
      const projectHref = `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
      const canonicalPath = `${projectHref}/${model.slug}`
      return {
        body: (
          <div className="mx-auto w-full max-w-7xl px-6">
            <TrackView type="model_view" projectId={detail.project.id} modelId={detail.model.id} />
            <ContactFloatingCta />
            <div className="mt-8">
              <ProjectGallery
                images={detail.images}
                projectName={detail.project.name}
              />
            </div>
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-12">
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <ModelHeaderInfo detail={detail} projectHref={projectHref} />
              </div>
              <div className="order-2 lg:col-start-1 lg:row-start-2">
                <ModelMainDetails
                  model={detail.model}
                  baseCurrency={detail.project.base_currency}
                  exchangeRate={detail.project.exchange_rate}
                />
              </div>
              {detail.floorplan && (
                <div className="order-3 lg:col-start-1 lg:row-start-3">
                  <ModelFloorplan
                    floorplan={detail.floorplan}
                    modelName={detail.model.name}
                  />
                </div>
              )}
              <ContactSidebar
                className="order-4 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-4"
                projectId={detail.project.id}
                modelId={detail.model.id}
                projectName={detail.project.name}
                modelName={detail.model.name}
                suggestedProjects={suggestedProjects}
              />
              <div className="order-5 flex flex-col gap-12 lg:col-start-1 lg:row-start-4">
                <ModelReadableSummary
                  modelName={detail.model.name}
                  projectName={detail.project.name}
                  zoneName={detail.zone?.name ?? zone.name}
                  stage={detail.project.stage}
                  currency={detail.project.base_currency}
                  priceFrom={detail.model.price_from}
                  monthlyFrom={detail.model.monthly_payment_from}
                  sizeM2={detail.model.size_m2}
                  bedrooms={detail.model.bedrooms}
                  bathrooms={detail.model.bathrooms}
                  parkingSpots={detail.model.parking_spots}
                />
                <ModelSpecs model={detail.model} />
                <ModelsGrid
                  models={detail.siblings}
                  currency={detail.project.base_currency}
                  basePath={projectHref}
                  title={`Otros modelos de ${detail.project.name}`}
                  images={detail.siblingImages}
                />
                <ProjectAmenities amenities={detail.project.amenities} />
                <ProjectLocation
                  latitude={detail.project.latitude}
                  longitude={detail.project.longitude}
                  googleMapsUrl={detail.project.google_maps_url}
                  zoneName={detail.zone?.name ?? zone.name}
                  projectName={detail.project.name}
                />
                <ProjectStatusTimeline current={detail.project.stage} />
              </div>
            </div>
          </div>
        ),
        jsonLd: [buildProductWithOffer({ detail, canonicalPath })],
      }
    }
  }
}

