import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { resolveSlug, type Resolved } from '@/lib/resolve-slug'
import { tipoSlug } from '@/lib/types/property'
import { getProjectsForIndex } from '@/lib/queries/index-pages'
import { getProjectDetail } from '@/lib/queries/project'
import { getModelDetail } from '@/lib/queries/model'
import { formatPriceFrom } from '@/lib/format/price'
import { Breadcrumbs } from '@/components/breadcrumbs/Breadcrumbs'
import { IndexHero } from '@/components/index/IndexHero'
import { ProjectGrid } from '@/components/index/ProjectGrid'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ModelsGrid } from '@/components/project/ModelsGrid'
import { ModelHeader } from '@/components/model/ModelHeader'
import { ModelSpecs } from '@/components/model/ModelSpecs'
import { ContactSection } from '@/components/contact/ContactSection'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbsFor, labelForTipo } from '@/lib/breadcrumbs'
import {
  buildBreadcrumbList,
  buildItemList,
  buildRealEstateListing,
  buildPlace,
  buildOrganizationDeveloper,
  buildProductWithOffer,
} from '@/lib/seo/jsonld'

export const dynamicParams = true
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams() {
  const supabase = createServerClient()
  const [{ data: zones }, { data: projects }] = await Promise.all([
    supabase.from('zones').select('url_slug').eq('is_active', true),
    supabase
      .from('projects')
      .select('slug, property_type, zones(url_slug)')
      .eq('is_active', true),
  ])

  const tipoParams = [{ slug: ['apartamentos'] }, { slug: ['casas'] }]
  const zoneParams = (zones ?? []).map((z) => ({ slug: [z.url_slug] }))

  const projectsWithZone = (projects ?? []).filter(
    (p): p is typeof p & { zones: { url_slug: string } } => p.zones !== null,
  )

  const zoneTipoSet = new Set<string>()
  const zoneTipoParams = projectsWithZone.flatMap((p) => {
    const key = `${p.zones.url_slug}/${tipoSlug(p.property_type)}`
    if (zoneTipoSet.has(key)) return []
    zoneTipoSet.add(key)
    return [{ slug: [p.zones.url_slug, tipoSlug(p.property_type)] }]
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

  switch (resolved.kind) {
    case 'tipo':
      return {
        title: `${labelForTipo(resolved.data.tipo)} en preventa Guatemala | Sitúa`,
        alternates: { canonical: `/${tipoSlug(resolved.data.tipo)}` },
      }
    case 'zone':
      return {
        title: `Proyectos en ${resolved.data.zone.name} | Apartamentos y Casas | Sitúa`,
        alternates: { canonical: `/${resolved.data.zone.url_slug}` },
      }
    case 'zone-tipo':
      return {
        title: `${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name} | Sitúa`,
        alternates: {
          canonical: `/${resolved.data.zone.url_slug}/${tipoSlug(resolved.data.tipo)}`,
        },
      }
    case 'project': {
      const { project, zone } = resolved.data
      return {
        title: `${project.name} | ${zone.name} | Sitúa`,
        description: project.short_description ?? undefined,
        alternates: {
          canonical: `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`,
        },
      }
    }
    case 'model': {
      const { model, project, zone } = resolved.data
      return {
        title: `${model.name} en ${project.name} | ${formatPriceFrom(model.price_from, project.base_currency)} | Sitúa`,
        description: model.description ?? project.short_description ?? undefined,
        alternates: {
          canonical: `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}/${model.slug}`,
        },
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
              subtitle="Apartamentos y casas en venta."
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
      const basePath = `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
      const jsonLd: object[] = [
        buildRealEstateListing({ detail, zone, canonicalPath: basePath }),
        buildPlace({ detail, zone, canonicalPath: basePath }),
      ]
      const developerNode = buildOrganizationDeveloper(detail)
      if (developerNode) jsonLd.push(developerNode)
      return {
        body: (
          <>
            <ProjectHeader detail={detail} zoneName={zone.name} />
            <ModelsGrid
              models={detail.models}
              currency={project.base_currency}
              basePath={basePath}
            />
            <ContactSection
              projectId={detail.project.id}
              projectName={detail.project.name}
            />
          </>
        ),
        jsonLd,
      }
    }
    case 'model': {
      const { model, project, zone } = resolved.data
      const detail = await getModelDetail(model.id, project.id, model.slug)
      if (!detail) notFound()
      const projectHref = `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
      const canonicalPath = `${projectHref}/${model.slug}`
      return {
        body: (
          <>
            <ModelHeader detail={detail} projectHref={projectHref} />
            <ModelSpecs model={detail.model} />
            <ContactSection
              projectId={detail.project.id}
              modelId={detail.model.id}
              projectName={detail.project.name}
            />
          </>
        ),
        jsonLd: [buildProductWithOffer({ detail, canonicalPath })],
      }
    }
  }
}

