import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { resolveSlug } from '@/lib/resolve-slug'
import { tipoSlug } from '@/lib/types/property'

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
      return { title: `${labelForTipo(resolved.data.tipo)} en Guatemala | Sitúa` }
    case 'zone':
      return { title: `Proyectos en ${resolved.data.zone.name} | Sitúa` }
    case 'zone-tipo':
      return {
        title: `${labelForTipo(resolved.data.tipo)} en ${resolved.data.zone.name} | Sitúa`,
      }
    case 'project':
      return {
        title: `${resolved.data.project.name} | ${resolved.data.zone.name} | Sitúa`,
        description: resolved.data.project.short_description ?? undefined,
      }
    case 'not-found':
      return { title: 'Página no encontrada | Sitúa' }
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolveSlug(slug)

  if (resolved.kind === 'not-found') notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">
        kind: {resolved.kind}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{titleFor(resolved)}</h1>
      <pre className="mt-6 overflow-auto rounded-md bg-muted p-4 text-xs">
        {JSON.stringify(resolved.data, null, 2)}
      </pre>
    </main>
  )
}

function titleFor(r: Exclude<Awaited<ReturnType<typeof resolveSlug>>, { kind: 'not-found' }>) {
  switch (r.kind) {
    case 'tipo':
      return labelForTipo(r.data.tipo)
    case 'zone':
      return r.data.zone.name
    case 'zone-tipo':
      return `${labelForTipo(r.data.tipo)} en ${r.data.zone.name}`
    case 'project':
      return r.data.project.name
  }
}

function labelForTipo(tipo: 'apartamento' | 'casa'): string {
  return tipo === 'apartamento' ? 'Apartamentos' : 'Casas'
}
