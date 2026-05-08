import { getSliderProjects } from '@/lib/queries/home'
import { ProjectCard } from '@/components/project/ProjectCard'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function AvailableProjects() {
  const projects = shuffle(await getSliderProjects())
  if (projects.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl overflow-visible px-6 py-20">
      <h2 className="mb-10 text-3xl font-semibold tracking-[-0.015em] text-ink sm:text-[2rem]">
        Proyectos disponibles
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  )
}
