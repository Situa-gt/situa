import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { tipoSlug } from '@/lib/types/property'
import { formatPriceFrom } from '@/lib/format/price'
import type { ProjectCardData } from '@/lib/queries/home'

interface Props {
  project: ProjectCardData
  priority?: boolean
}

// Note: every ancestor up to the section must keep `overflow-visible`,
// because the Cotizar button is intentionally half outside the card.
export function ProjectCard({ project, priority = false }: Props) {
  const cover = project.cover_url ?? '/placeholder-card.svg'
  const alt = project.cover_alt ?? `Imagen de ${project.name}`
  const zoneName = project.zone?.name ?? ''
  const href = project.zone
    ? `/${project.zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}`
    : '#'
  const cotizarHref = `${href}#contacto`

  return (
    <article className="relative">
      <Link href={href} className="group block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-200">
          <Image
            src={cover}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
          <div className="absolute inset-x-0 bottom-0 bg-zinc-900/60 px-4 py-3 text-white backdrop-blur-sm">
            <h3 className="text-base font-semibold leading-tight">{project.name}</h3>
            {zoneName && (
              <p className="mt-0.5 text-xs text-zinc-200">{zoneName}</p>
            )}
            {project.price_from !== null && (
              <p className="mt-1 text-sm font-medium">
                {formatPriceFrom(project.price_from, project.base_currency)}
              </p>
            )}
          </div>
        </div>
      </Link>
      <Link
        href={cotizarHref}
        aria-label={`Cotizar ${project.name}`}
        className="absolute -bottom-5 right-4 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-800"
      >
        Cotizar
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  )
}
