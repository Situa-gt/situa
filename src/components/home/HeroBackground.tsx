import { getHeroProjects } from '@/lib/queries/home'
import { HeroBackgroundClient } from './HeroBackgroundClient'

interface Props {
  children: React.ReactNode
}

export async function HeroBackground({ children }: Props) {
  const projects = await getHeroProjects()
  return <HeroBackgroundClient projects={projects}>{children}</HeroBackgroundClient>
}
