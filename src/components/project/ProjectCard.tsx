import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { tipoSlug } from '@/lib/types/property'
import { formatPriceFrom } from '@/lib/format/price'
import { stageLabel, stageIcon } from '@/lib/format/stage'
import { formatPriceValue } from '@/lib/format/price'
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
  const StageIcon = project.stage ? stageIcon(project.stage) : null

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
          {project.is_featured && (
            <div className="group/feat absolute left-3 top-3 z-10">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/90 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-white text-white" />
              </div>
              <span className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover/feat:block">
                Proyecto destacado
              </span>
            </div>
          )}
          {StageIcon && project.stage && (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-brand-purple/90 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <StageIcon className="h-3 w-3 shrink-0" />
              {stageLabel(project.stage)}
            </div>
          )}
          {/* Eased multi-stop scrim — simulates a natural ease-in curve so the fade reads as smooth to the eye */}
          <div
            className="absolute inset-x-0 bottom-0 h-[70%]"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.70) 22%, rgba(0,0,0,0.46) 42%, rgba(0,0,0,0.20) 62%, rgba(0,0,0,0.06) 78%, transparent 100%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-8 text-white">
            <h3 className="text-lg font-semibold leading-tight tracking-tight">{project.name}</h3>
            {zoneName && (
              <p className="mt-0.5 text-xs text-white/75">{zoneName}</p>
            )}
            {project.price_from !== null && (
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-white/90">
                {formatPriceFrom(project.price_from, project.base_currency)}
                {project.monthly_payment_from !== null && (
                  <span className="text-xs font-normal text-white/70">
                    · Cuota desde {formatPriceValue(project.monthly_payment_from, project.base_currency)}/mes
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </Link>
      <CtaButton
        href={href}
        size="sm"
        aria-label={`Conocer más sobre ${project.name}`}
        className="absolute -bottom-4 right-4 shadow-lg"
      >
        Conocer más
      </CtaButton>
    </article>
  )
}
