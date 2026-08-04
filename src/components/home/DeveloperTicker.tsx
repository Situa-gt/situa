import { DeveloperTickerCarousel } from './DeveloperTickerCarousel'
import { getDeveloperLogos } from '@/lib/queries/home'

// Repeat the array until we have at least `min` items for a seamless loop
function fillTicker<T>(arr: T[], min: number): T[] {
  if (arr.length === 0) return []
  const result = [...arr]
  while (result.length < min) result.push(...arr)
  return result
}

export async function DeveloperTicker() {
  const logos = await getDeveloperLogos()
  if (logos.length === 0) return null

  const items = fillTicker(logos, 12)

  return (
    <section className="overflow-hidden pb-12 pt-24">
      <DeveloperTickerCarousel logos={items} />
    </section>
  )
}
