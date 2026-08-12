'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ProjectCard } from '@/components/project/ProjectCard'
import type { ProjectCardData } from '@/lib/queries/home'

interface Props {
  projects: ProjectCardData[]
  title?: string
  subtitle?: string
}

export function ProjectSlider({ projects, title = 'Proyectos disponibles', subtitle }: Props) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    reduceMotion ? [] : [Autoplay({ delay: 5000, stopOnInteraction: false })],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    setSnapCount(emblaApi.scrollSnapList().length)
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi])

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  )

  if (projects.length === 0) return null

  return (
    <section className="relative z-0 mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-ink sm:text-[1.85rem]">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-ink sm:text-base">{subtitle}</p>}
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex pb-8">
          {projects.map((p) => (
            <div
              key={p.id}
              className="min-w-0 mr-6 flex-[0_0_82%] sm:flex-[0_0_42%] lg:flex-[0_0_29%] xl:flex-[0_0_24%]"
            >
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      </div>
      {snapCount > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === selectedIndex ? 'w-6 bg-brand-purple' : 'w-2 bg-zinc-300'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
