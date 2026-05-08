import Image from 'next/image'
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
      <div className="ticker-track flex w-max gap-12">
        {[0, 1].map((dup) => (
          <div key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center gap-12">
            {items.map((logo, i) => (
              <div
                key={`${dup}-${i}`}
                className="relative h-16 w-40 shrink-0"
              >
                <Image
                  src={logo.url}
                  alt={logo.alt ?? `Logo de ${logo.developerName}`}
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
