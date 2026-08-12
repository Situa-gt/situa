import { getFeaturedProjects } from '@/lib/queries/home'
import { ProjectSlider } from './ProjectSlider'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function FeaturedProjects() {
  const projects = shuffle(await getFeaturedProjects()).slice(0, 12)
  if (projects.length === 0) return null

  return (
    <ProjectSlider
      projects={projects}
      title="Proyectos destacados"
      subtitle="Opciones activas con buena visibilidad dentro de Sitúa."
    />
  )
}
