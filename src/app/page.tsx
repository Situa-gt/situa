import type { Metadata } from 'next'
import { Hero } from '@/components/home/Hero'
import { HeroBackground } from '@/components/home/HeroBackground'
import { HomeBelowFold } from '@/components/home/HomeBelowFold'
import { SearchResults } from '@/components/home/SearchResults'
import { hasAnyFilter, parseFilters, type FilterParams } from '@/lib/filters/parse'

export const revalidate = 3600

interface PageProps {
  searchParams: Promise<FilterParams>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = parseFilters(await searchParams)
  const filtered = hasAnyFilter(filters)
  return {
    title: 'Sitúa | Proyectos en preventa en Guatemala',
    description:
      'Encuentra apartamentos y casas en preventa y construcción en Guatemala.',
    alternates: { canonical: 'https://situa.gt/' },
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function Home({ searchParams }: PageProps) {
  const raw = await searchParams
  const filters = parseFilters(raw)
  const filtered = hasAnyFilter(filters)

  return (
    <main className="flex flex-1 flex-col">
      <HeroBackground>
        <Hero initial={filters} />
      </HeroBackground>
      {filtered ? <SearchResults filters={filters} /> : <HomeBelowFold />}
    </main>
  )
}
