import Image from 'next/image'
import Link from 'next/link'
import { tipoSlug } from '@/lib/types/property'
import { formatPriceFrom } from '@/lib/format/price'
import { CtaButton } from '@/components/ui/cta-button'
import type { ProjectCardData } from '@/lib/queries/home'

interface Props {
  project: ProjectCardData
  priority?: boolean
}

// Note: every ancestor up to the section must keep `overflow-visible`,
// because the Ver button is intentionally half outside the card.
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
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src={cover}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
          {/* Eased multi-stop scrim — simulates a natural ease-in curve so the fade reads as smooth to the eye */}
          <div
            className="absolute inset-x-0 bottom-0 h-[70%]"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.70) 22%, rgba(0,0,0,0.46) 42%, rgba(0,0,0,0.20) 62%, rgba(0,0,0,0.06) 78%, transparent 100%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-white">
            <h3 className="text-lg font-semibold leading-tight tracking-tight">{project.name}</h3>
            {zoneName && (
              <p className="mt-0.5 text-xs text-white/75">{zoneName}</p>
            )}
            {project.price_from !== null && (
              <p className="mt-1.5 text-sm font-medium text-white/90">
                {formatPriceFrom(project.price_from, project.base_currency)}
              </p>
            )}
          </div>
        </div>
      </Link>
      <CtaButton
        href={href}
        aria-label={`Conocer más sobre ${project.name}`}
        className="absolute -bottom-5 right-4 shadow-lg"
      >
        Conocer más
      </CtaButton>
    </article>
  )
}
