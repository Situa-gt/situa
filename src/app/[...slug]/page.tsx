import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { resolveSlug, type Resolved } from '@/lib/resolve-slug'
import { tipoSlug, type PropertyType } from '@/lib/types/property'
import { getProjectsForIndex } from '@/lib/queries/index-pages'
import { getProjectDetail } from '@/lib/queries/project'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs/Breadcrumbs'
import { IndexHero } from '@/components/index/IndexHero'
import { ProjectGrid } from '@/components/index/ProjectGrid'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ModelsGrid } from '@/components/project/ModelsGrid'

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

  return [...tipoParams, ...zoneParams, ...zoneTipoParams, ...projectParams]
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
    case 'not-found':
      return { title: 'Página no encontrada | Sitúa' }
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolveSlug(slug)

  if (resolved.kind === 'not-found') notFound()

  const body = await renderBody(resolved)
  return (
    <main className="pb-20">
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <Breadcrumbs items={breadcrumbsFor(resolved)} />
      </div>
      {body}
    </main>
  )
}

async function renderBody(resolved: Exclude<Resolved, { kind: 'not-found' }>) {
  switch (resolved.kind) {
    case 'tipo': {
      const projects = await getProjectsForIndex({ tipo: resolved.data.tipo })
      return (
        <>
          <IndexHero
            title={`${labelForTipo(resolved.data.tipo)} en Guatemala`}
            subtitle="Proyectos en preventa, construcción y entrega inmediata."
          />
          <ProjectGrid projects={projects} />
        </>
      )
    }
    case 'zone': {
      const projects = await getProjectsForIndex({ zoneId: resolved.data.zone.id })
      return (
        <>
          <IndexHero
            title={`Proyectos en ${resolved.data.zone.name}`}
            subtitle="Apartamentos y casas en venta."
          />
          <ProjectGrid projects={projects} />
        </>
      )
    }
    case 'zone-tipo': {
      const projects = await getProjectsForIndex({
        tipo: resolved.data.tipo,
        zoneId: resolved.data.zone.id,
      })
      return (
        <>
          <IndexHero
            title={`${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name}`}
          />
          <ProjectGrid projects={projects} />
        </>
      )
    }
    case 'project': {
      const { project, zone } = resolved.data
      const detail = await getProjectDetail(project.id, project.slug)
      if (!detail) notFound()
      const basePath = `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
      return (
        <>
          <ProjectHeader detail={detail} zoneName={zone.name} />
          <ModelsGrid
            models={detail.models}
            currency={project.base_currency}
            basePath={basePath}
          />
          <section
            id="contacto"
            className="mx-auto w-full max-w-7xl px-6 py-12"
            aria-labelledby="contacto-heading"
          >
            <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center">
              <h2 id="contacto-heading" className="text-xl font-semibold text-zinc-900">
                ¿Te interesa este proyecto?
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Pronto podrás contactar al desarrollador desde aquí.
              </p>
            </div>
          </section>
        </>
      )
    }
  }
}

function breadcrumbsFor(
  resolved: Exclude<Resolved, { kind: 'not-found' }>,
): Crumb[] {
  switch (resolved.kind) {
    case 'tipo':
      return [
        { label: 'Inicio', href: '/' },
        { label: labelForTipo(resolved.data.tipo) },
      ]
    case 'zone':
      return [
        { label: 'Inicio', href: '/' },
        { label: resolved.data.zone.name },
      ]
    case 'zone-tipo':
      return [
        { label: 'Inicio', href: '/' },
        { label: resolved.data.zone.name, href: `/${resolved.data.zone.url_slug}` },
        { label: labelForTipo(resolved.data.tipo) },
      ]
    case 'project': {
      const { project, zone } = resolved.data
      return [
        { label: 'Inicio', href: '/' },
        { label: zone.name, href: `/${zone.url_slug}` },
        {
          label: labelForTipo(project.property_type),
          href: `/${zone.url_slug}/${tipoSlug(project.property_type)}`,
        },
        { label: project.name },
      ]
    }
  }
}

function labelForTipo(tipo: PropertyType): string {
  return tipo === 'apartamento' ? 'Apartamentos' : 'Casas'
}
