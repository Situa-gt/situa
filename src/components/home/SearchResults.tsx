import Link from 'next/link'
import { applyFilters } from '@/lib/filters/apply'
import { getProjectCardsByIds } from '@/lib/queries/home'
import { ProjectCard } from '@/components/project/ProjectCard'
import type { Filters } from '@/lib/filters/parse'

interface Props {
  filters: Filters
}

export async function SearchResults({ filters }: Props) {
  const projects = await applyFilters(filters)
  const cards = await getProjectCardsByIds(projects.map((p) => p.id))

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-16">
      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-lg text-zinc-700">
            No encontramos proyectos con esos filtros.
          </p>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
          >
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
            Resultados ({cards.length})
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
