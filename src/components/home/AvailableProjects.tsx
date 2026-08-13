import { getSliderProjects } from '@/lib/queries/home'
import { ProjectGridSection } from './ProjectGridSection'

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
    <ProjectGridSection
      projects={projects}
      title="Explora proyectos disponibles"
      subtitle="Apartamentos y casas en Guatemala, listos para comparar por zona y etapa."
    />
  )
}
