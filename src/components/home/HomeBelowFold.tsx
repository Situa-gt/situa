import { getSliderProjects } from '@/lib/queries/home'
import { ProjectSlider } from './ProjectSlider'
import { FeaturedProjects } from './FeaturedProjects'

export async function HomeBelowFold() {
  const sliderProjects = await getSliderProjects()
  return (
    <>
      <ProjectSlider projects={sliderProjects} />
      <FeaturedProjects />
    </>
  )
}
