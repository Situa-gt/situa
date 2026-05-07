import { getSliderProjects } from '@/lib/queries/home'
import { Reveal } from '@/components/ui/reveal'
import { ProjectSlider } from './ProjectSlider'
import { FeaturedProjects } from './FeaturedProjects'
import { HomeBanner } from './HomeBanner'
import { DeveloperTicker } from './DeveloperTicker'

export async function HomeBelowFold() {
  const sliderProjects = await getSliderProjects()
  return (
    <>
      <Reveal>
        <FeaturedProjects />
      </Reveal>
      <Reveal>
        <HomeBanner />
      </Reveal>
      <Reveal>
        <ProjectSlider projects={sliderProjects} />
      </Reveal>
      <Reveal>
        <DeveloperTicker />
      </Reveal>
    </>
  )
}
