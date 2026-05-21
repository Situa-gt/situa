'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { tipoSlug } from '@/lib/types/property'
import type { HeroProjectData } from '@/lib/queries/home'

interface Props {
  projects: HeroProjectData[]
  children: React.ReactNode
}

export function HeroBackgroundClient({ projects, children }: Props) {
  const [project, setProject] = useState<HeroProjectData | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (projects.length === 0) return
    setProject(projects[Math.floor(Math.random() * projects.length)])
  }, [projects])

  const href = project?.zone
    ? `/${project.zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
    : null

  function handleClick(e: React.MouseEvent<HTMLElement>) {
    if (!href) return
    const el = e.target as HTMLElement
    if (!el.closest('a, button, input, select, textarea, label, [role="button"], [role="combobox"]')) {
      router.push(href)
    }
  }

  return (
    <section
      className={`relative isolate flex min-h-[78vh] flex-col overflow-hidden${href ? ' cursor-pointer' : ''}`}
      style={!project?.cover_url ? {
        backgroundImage: 'linear-gradient(135deg, #6B66EB 0%, #6B66EB 55%, #fd7d29 100%)',
      } : undefined}
      onClick={handleClick}
    >
      {/* Gradient noise (fallback only) */}
      {!project?.cover_url && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-soft-light"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 80%, white 0%, transparent 45%)',
          }}
        />
      )}

      {/* Project image */}
      {project?.cover_url && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={project.cover_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
              aria-hidden
            />
          </div>
          {/* Brand-tinted scrim so Hero text stays readable */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(107,102,235,0.62) 0%, rgba(107,102,235,0.38) 50%, rgba(253,125,41,0.20) 100%)',
            }}
          />
        </>
      )}

      {children}

      {/* Project name hint */}
      {project && href && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-0.5 rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur-sm sm:flex"
        >
          <span className="text-[11px] font-normal text-white/70">Conoce más acerca de</span>
          <span className="text-sm font-semibold text-white">
            {project.name}{project.zone ? ` · ${project.zone.name}` : ''}
          </span>
        </div>
      )}
    </section>
  )
}
