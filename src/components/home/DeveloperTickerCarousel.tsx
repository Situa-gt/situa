'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { DeveloperLogoData } from '@/lib/queries/home'

interface DeveloperTickerCarouselProps {
  logos: DeveloperLogoData[]
}

export function DeveloperTickerCarousel({ logos }: DeveloperTickerCarouselProps) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const plugins = useMemo(
    () =>
      reduceMotion
        ? []
        : [
            Autoplay({
              delay: 2600,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ],
    [reduceMotion],
  )

  const [emblaRef] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: false,
      dragFree: true,
      loop: logos.length > 4,
      slidesToScroll: 'auto',
    },
    plugins,
  )

  if (logos.length === 0) return null

  return (
    <div
      className="cursor-grab overflow-hidden active:cursor-grabbing"
      ref={emblaRef}
      aria-label="Logos de desarrolladoras"
    >
      <div className="flex touch-pan-y items-center">
        {logos.map((logo, index) => (
          <div
            key={`${logo.developerId}-${index}`}
            className="relative mr-12 h-16 min-w-0 flex-[0_0_160px] shrink-0 select-none"
          >
            {logo.href ? (
              <a href={logo.href} className="block h-full w-full" target="_blank" rel="noreferrer">
                <TickerLogo logo={logo} />
              </a>
            ) : (
              <TickerLogo logo={logo} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TickerLogo({ logo }: { logo: DeveloperLogoData }) {
  return (
    <Image
      src={logo.url}
      alt={logo.alt ?? `Logo de ${logo.developerName}`}
      fill
      sizes="160px"
      className="pointer-events-none object-contain"
      draggable={false}
    />
  )
}
