import { getFeaturedProjects } from '@/lib/queries/home'
import { ProjectCard } from '@/components/project/ProjectCard'

export async function FeaturedProjects() {
  const projects = await getFeaturedProjects()
  if (projects.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-16">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
        Proyectos Destacados
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  )
}
