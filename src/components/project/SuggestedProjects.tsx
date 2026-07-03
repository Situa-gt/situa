'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { ProjectCard } from '@/components/project/ProjectCard'
import type { SuggestedProjectData } from '@/lib/queries/suggestions'

interface Props {
  projects: SuggestedProjectData[]
}

export function SuggestedProjects({ projects }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snapCount, setSnapCount] = useState(0)
  const canNavigate = snapCount > 1

  useEffect(() => {
    if (!emblaApi) return

    const update = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
      setSnapCount(emblaApi.scrollSnapList().length)
    }

    update()
    emblaApi.on('select', update)
    emblaApi.on('reInit', update)

    return () => {
      emblaApi.off('select', update)
      emblaApi.off('reInit', update)
    }
  }, [emblaApi])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (projects.length === 0) return null

  return (
    <section className="mt-14 overflow-visible border-t border-hairline pt-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Tambien te puede interesar
          </h2>
        </div>
        {canNavigate && (
          <div className="hidden items-center gap-4 sm:flex">
            <span className="text-sm font-medium text-ink">
              {selectedIndex + 1} / {snapCount}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Ver recomendaciones anteriores"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white text-ink shadow-sm transition hover:bg-zinc-50 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Ver mas recomendaciones"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white text-ink shadow-md transition hover:bg-zinc-50 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="-mx-6 overflow-hidden px-6 sm:mx-0 sm:px-0" ref={emblaRef}>
        <div className="flex gap-5 pb-10">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_310px] lg:flex-[0_0_calc(33.333%_-_0.875rem)]"
            >
              <ProjectCard project={project} priority={index < 3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
