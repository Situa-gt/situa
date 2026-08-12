import { Reveal } from '@/components/ui/reveal'
import { FeaturedProjects } from './FeaturedProjects'
import { AvailableProjects } from './AvailableProjects'
import { HomeBanner } from './HomeBanner'
import { DeveloperTicker } from './DeveloperTicker'
import { BannerSliderSection } from './BannerSliderSection'
import { FeaturedModels } from './FeaturedModels'

export async function HomeBelowFold() {
  return (
    <div className="relative z-0 bg-white">
{/*       <Reveal>
        <BannerSliderSection />
      </Reveal> */}
      <Reveal>
        <FeaturedProjects />
      </Reveal>
      <Reveal>
        <BannerSliderSection />
      </Reveal>
      <Reveal>
        <AvailableProjects />
      </Reveal>
      <Reveal>
        <FeaturedModels />
      </Reveal>
      <Reveal>
        <DeveloperTicker />
      </Reveal>
    </div>
  )
}
