import { getBannerProjects } from '@/lib/queries/home'
import { BannerSlider } from './BannerSlider'

export async function BannerSliderSection() {
  const projects = await getBannerProjects()
  if (projects.length === 0) return null
  return <BannerSlider projects={projects} />
}
