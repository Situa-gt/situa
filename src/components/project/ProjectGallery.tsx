'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import type { ProjectGalleryImage } from '@/lib/queries/project'

interface Props {
  images: ProjectGalleryImage[]
  projectName: string
}

export function ProjectGallery({ images, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const total = images.length
  if (total === 0) return null

  const main = images[0]
  const second = images[1] ?? main
  const thirdBg = images[2] ?? second
  const hasOverlay = total > 2

  const openAt = (i: number) => {
    setIndex(i)
    setOpen(true)
  }

  return (
    <>
      <div className="grid h-[420px] w-full grid-cols-1 grid-rows-2 gap-3 overflow-hidden rounded-3xl sm:h-[480px] lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Tile 1 — big cover */}
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Abrir galería de ${projectName}`}
          className="group relative col-span-1 row-span-2 cursor-pointer overflow-hidden rounded-3xl bg-zinc-100"
        >
          <Image
            src={main.url}
            alt={main.alt ?? `Imagen de ${projectName}`}
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority
            fetchPriority="high"
          />
        </button>

        {/* Tile 2 — top right */}
        <button
          type="button"
          onClick={() => openAt(1)}
          aria-label={`Abrir imagen 2 de ${projectName}`}
          className="group relative hidden cursor-pointer overflow-hidden rounded-3xl bg-zinc-100 lg:block"
        >
          <Image
            src={second.url}
            alt={second.alt ?? `Imagen 2 de ${projectName}`}
            fill
            sizes="400px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </button>

        {/* Tile 3 — "+N" overlay */}
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Ver las ${total} imágenes`}
          className="group relative hidden cursor-pointer overflow-hidden rounded-3xl bg-zinc-200 lg:block"
        >
          <Image
            src={thirdBg.url}
            alt=""
            aria-hidden
            fill
            sizes="400px"
            className="scale-110 object-cover blur-md brightness-75 transition-transform duration-500 group-hover:scale-[1.18]"
          />
          <div className="absolute inset-0 bg-brand-purple/30 transition-colors duration-300 group-hover:bg-brand-purple/45" aria-hidden />
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-white">
            <span className="flex items-center gap-1 text-3xl font-semibold tracking-tight">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
              {hasOverlay ? total : 1}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-white/85">
              Imágenes
            </span>
          </div>
        </button>
      </div>

      {open && (
        <GalleryModal
          images={images}
          index={index}
          setIndex={setIndex}
          projectName={projectName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

interface ModalProps {
  images: ProjectGalleryImage[]
  index: number
  setIndex: (i: number) => void
  projectName: string
  onClose: () => void
}

function GalleryModal({ images, index, setIndex, projectName, onClose }: ModalProps) {
  const total = images.length
  const current = images[index]

  const prev = useCallback(
    () => setIndex((index - 1 + total) % total),
    [index, total, setIndex],
  )
  const next = useCallback(
    () => setIndex((index + 1) % total),
    [index, total, setIndex],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  // Portal to document.body so the transform on .route-fade doesn't trap our z-index
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${projectName}`}
      className="fixed inset-0 z-[200] flex flex-col bg-black/92 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar galería"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="flex min-h-0 flex-1 flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image area — min-h-0 lets flex-1 shrink so thumbnails are always visible */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <button
            type="button"
            onClick={prev}
            aria-label="Imagen anterior"
            className="absolute left-2 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative h-full min-h-0 w-full">
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt ?? `Imagen ${index + 1} de ${projectName}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Imagen siguiente"
            className="absolute right-2 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center justify-center text-xs text-white/70">
          {index + 1} / {total}
        </div>

        <div className="flex justify-center gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg transition sm:h-20 sm:w-32 ${
                i === index
                  ? 'ring-2 ring-brand-orange ring-offset-2 ring-offset-black'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt=""
                aria-hidden
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
