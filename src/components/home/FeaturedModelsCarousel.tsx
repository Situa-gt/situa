'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FeaturedModelCard } from './FeaturedModelCard'
import type { FeaturedModelCardData } from '@/lib/queries/home'

const SCROLL_INTERVAL_MS = 3500

interface Props {
  models: FeaturedModelCardData[]
}

export function FeaturedModelsCarousel({ models }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const paused = useRef(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tick = () => {
      if (paused.current || !track) return
      scrollBy(1)
    }

    const id = setInterval(tick, SCROLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  function step() {
    const track = trackRef.current
    if (!track) return 0
    const cardWidth = track.firstElementChild?.clientWidth ?? 0
    return cardWidth + 24 // gap-6
  }

  function scrollBy(dir: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const maxScroll = track.scrollWidth - track.clientWidth
    const next = track.scrollLeft + dir * step()

    if (dir === 1 && next >= maxScroll - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (dir === -1 && track.scrollLeft <= 1) {
      track.scrollTo({ left: maxScroll, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: dir * step(), behavior: 'smooth' })
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* Prev */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Anterior"
        className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-hairline bg-white shadow-md transition hover:bg-zinc-50 active:scale-95 sm:-left-5"
      >
        <ChevronLeft className="h-4 w-4 text-ink" />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {models.map((model) => (
          <div
            key={model.id}
            className="w-[80vw] shrink-0 [scroll-snap-align:start] sm:w-[340px] lg:w-[380px]"
          >
            <FeaturedModelCard model={model} />
          </div>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => scrollBy(1)}
        aria-label="Siguiente"
        className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-hairline bg-white shadow-md transition hover:bg-zinc-50 active:scale-95 sm:-right-5"
      >
        <ChevronRight className="h-4 w-4 text-ink" />
      </button>
    </div>
  )
}
