import { ProjectCard } from '@/components/project/ProjectCard'
import type { ProjectCardData } from '@/lib/queries/home'

interface Props {
  projects: ProjectCardData[]
  title: string
  subtitle?: string
}

export function ProjectGridSection({ projects, title, subtitle }: Props) {
  if (projects.length === 0) return null

  return (
    <section className="relative z-0 mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold tracking-[-0.015em] text-ink sm:text-[1.85rem]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-ink sm:text-base">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} priority={index < 3} />
        ))}
      </div>
    </section>
  )
}
