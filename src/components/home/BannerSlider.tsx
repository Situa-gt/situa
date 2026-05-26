'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProjectCardData } from '@/lib/queries/home'
import { formatPriceValue } from '@/lib/format/price'
import { tipoSlug } from '@/lib/types/property'

interface BannerSliderProps {
  projects: ProjectCardData[]
}

export function BannerSlider({ projects }: BannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasMultiple = projects.length > 1

  const go = useCallback((idx: number) => {
    setCurrent(((idx % projects.length) + projects.length) % projects.length)
  }, [projects.length])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % projects.length)
    }, 4000)
  }, [projects.length])

  useEffect(() => {
    if (!hasMultiple) return
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hasMultiple, startTimer])

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current) }
  const resume = () => { if (hasMultiple) startTimer() }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12">
      <div
        className="relative isolate overflow-hidden rounded-3xl aspect-[4/3] sm:aspect-[16/7]"
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {projects.map((p, i) => {
          const href = p.zone
            ? `/${p.zone.url_slug}/${tipoSlug(p.property_type)}/${p.slug}`
            : '#'
          return (
            <div
              key={p.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
              aria-hidden={i !== current}
            >
              {p.cover_url ? (
                <Image
                  src={p.cover_url}
                  alt={p.cover_alt ?? p.name}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div className="absolute inset-0 bg-brand-purple" />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.08) 100%)',
                }}
              />
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 flex h-full flex-col justify-end p-8 sm:p-12"
              >
                {p.zone && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {p.zone.name}
                  </span>
                )}
                <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-4xl">
                  {p.name}
                </h2>
                {p.price_from !== null && (
                  <p className="mt-2 text-sm font-medium text-white/80">
                    Desde {formatPriceValue(p.price_from, p.base_currency)}
                  </p>
                )}
              </Link>
            </div>
          )
        })}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(current - 1)}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {hasMultiple && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {projects.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { go(i); startTimer() }}
                aria-label={`Ir a diapositiva ${i + 1}`}
                className={`h-2 cursor-pointer rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
