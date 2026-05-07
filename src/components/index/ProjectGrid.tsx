import { ProjectCard } from '@/components/project/ProjectCard'
import type { ProjectCardData } from '@/lib/queries/home'

interface Props {
  projects: ProjectCardData[]
  emptyMessage?: string
}

export function ProjectGrid({
  projects,
  emptyMessage = 'No encontramos proyectos en esta búsqueda.',
}: Props) {
  if (projects.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <p className="rounded-md border border-dashed border-zinc-300 px-6 py-12 text-center text-zinc-500">
          {emptyMessage}
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-10">
      <p className="mb-6 text-sm text-zinc-500">
        {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  )
}
