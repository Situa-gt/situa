import { getFeaturedProjects } from '@/lib/queries/home'
import { ProjectCard } from '@/components/project/ProjectCard'

export async function FeaturedProjects() {
  const projects = await getFeaturedProjects()
  if (projects.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-20">
      <h2 className="mb-10 text-3xl font-semibold tracking-[-0.015em] text-ink sm:text-[2rem]">
        Proyectos destacados
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  )
}
