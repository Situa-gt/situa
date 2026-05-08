'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'
import type { ModelImage } from '@/lib/queries/model'

interface Props {
  floorplan: ModelImage
  modelName: string
}

export function ModelFloorplan({ floorplan, modelName }: Props) {
  const [open, setOpen] = useState(false)
  const alt = floorplan.alt ?? `Plano de ${modelName}`

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">
        Plano del modelo
      </h2>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full cursor-zoom-in overflow-hidden rounded-2xl border border-hairline bg-zinc-50"
        aria-label="Ver plano en pantalla completa"
      >
        <Image
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
