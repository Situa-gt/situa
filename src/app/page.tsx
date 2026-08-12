import type { Metadata } from 'next'
import { Hero } from '@/components/home/Hero'
import { HomeBelowFold } from '@/components/home/HomeBelowFold'
import { SearchResults } from '@/components/home/SearchResults'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildOrganizationSitua, buildWebSite } from '@/lib/seo/jsonld'
import { hasAnyFilter, parseFilters, type FilterParams } from '@/lib/filters/parse'

export const revalidate = 3600

interface PageProps {
  searchParams: Promise<FilterParams>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = parseFilters(await searchParams)
  const filtered = hasAnyFilter(filters)
  return {
    title: 'Proyectos en preventa Guatemala | Apartamentos y Casas | Sitúa',
    description:
      'Explora más de 50 proyectos de apartamentos y casas en preventa y construcción en Guatemala. Compara precios, modelos y zonas. Plataforma verificada por ADIG.',
    alternates: { canonical: '/' },
    openGraph: {
      title: 'Proyectos en preventa Guatemala | Sitúa',
      description:
        'Explora más de 50 proyectos de apartamentos y casas en preventa en Guatemala. Compara precios, modelos y zonas.',
    },
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function Home({ searchParams }: PageProps) {
  const raw = await searchParams
  const filters = parseFilters(raw)
  const filtered = hasAnyFilter(filters)

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={[buildOrganizationSitua(), buildWebSite()]} />
      <Hero initial={filters} />
      {filtered ? <SearchResults filters={filters} /> : <HomeBelowFold />}
    </main>
  )
}
