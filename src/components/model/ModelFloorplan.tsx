'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import type { ModelImage } from '@/lib/queries/model'

interface Props {
  floorplans: ModelImage[]
  modelName: string
}

export function ModelFloorplan({ floorplans, modelName }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const count = floorplans.length
  const floorplan = floorplans[Math.min(index, count - 1)]
  const alt = floorplan.alt ?? `Plano de ${modelName}`
  const label = count > 1 ? `Plano ${index + 1} de ${count}` : 'Plano'

  const show = (next: number) => setIndex((next + count) % count)

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (count > 1 && e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
      if (count > 1 && e.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [open, count])

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">
        {count > 1 ? 'Planos del modelo' : 'Plano del modelo'}
      </h2>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full cursor-zoom-in overflow-hidden rounded-2xl border border-hairline bg-zinc-50"
        aria-label={`Ver ${label.toLowerCase()} en pantalla completa`}
      >
        <Image
          key={floorplan.id}
          src={floorplan.url}
          alt={alt}
          width={floorplan.width ?? 1200}
          height={floorplan.height ?? 900}
          className="w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 700px"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
            Ver plano
          </span>
        </div>
      </button>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Planos del modelo">
          {floorplans.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Plano ${i + 1} de ${count}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-zinc-50 transition ${
                i === index ? 'border-ink ring-1 ring-ink' : 'border-hairline opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={plan.url_sm ?? plan.url}
                alt=""
                fill
                className="object-contain"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Plano de ${modelName}`}
          className="fixed inset-0 z-[200] bg-black/95"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <span className="absolute left-4 top-5 z-10 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                {label}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); show(index - 1) }}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                aria-label="Plano anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); show(index + 1) }}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                aria-label="Plano siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/*
            overflow-auto + touch-action enables native pinch-to-zoom on mobile.
            The image is rendered at its natural dimensions so there is content
            to pan into after zooming.
          */}
          <div
            className="h-full w-full overflow-auto"
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={floorplan.id}
              src={floorplan.url}
              alt={alt}
              width={floorplan.width ?? 1200}
              height={floorplan.height ?? 900}
              className="block"
              style={{
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
