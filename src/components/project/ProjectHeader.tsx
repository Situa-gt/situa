import Image from 'next/image'
import { formatPriceFrom } from '@/lib/format/price'
import { stageLabel } from '@/lib/format/stage'
import type { ProjectDetailData } from '@/lib/queries/project'

interface Props {
  detail: ProjectDetailData
  zoneName: string
}

export function ProjectHeader({ detail, zoneName }: Props) {
  const { project, developer, cover, price_from } = detail
  const coverUrl = cover?.url ?? '/placeholder-card.svg'
  const coverAlt = cover?.alt ?? `Imagen de ${project.name}`

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-10">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-200">
        <Image
          src={coverUrl}
          alt={coverAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
          priority
          fetchPriority="high"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">
            {zoneName}
            {developer && <> · {developer.name}</>}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {project.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {stageLabel(project.stage)}
            </span>
          </div>
          {project.short_description && (
            <p className="mt-4 max-w-2xl text-base text-zinc-600">
              {project.short_description}
            </p>
          )}
        </div>

        {price_from !== null && (
          <div className="shrink-0">
            <p className="text-sm text-zinc-500">Desde</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatPriceFrom(price_from, project.base_currency)}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
