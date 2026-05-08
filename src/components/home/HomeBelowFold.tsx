import { Reveal } from '@/components/ui/reveal'
import { FeaturedProjects } from './FeaturedProjects'
import { AvailableProjects } from './AvailableProjects'
import { HomeBanner } from './HomeBanner'
import { DeveloperTicker } from './DeveloperTicker'

export async function HomeBelowFold() {
  return (
    <>
      <Reveal>
        <FeaturedProjects />
      </Reveal>
      <Reveal>
        <HomeBanner />
      </Reveal>
      <Reveal>
        <AvailableProjects />
      </Reveal>
      <Reveal>
        <DeveloperTicker />
      </Reveal>
    </>
  )
}
