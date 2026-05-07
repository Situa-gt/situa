import Image from 'next/image'
import Link from 'next/link'
import { formatPriceFrom } from '@/lib/format/price'
import { stageLabel } from '@/lib/format/stage'
import type { ModelDetailData } from '@/lib/queries/model'

interface Props {
  detail: ModelDetailData
  projectHref: string
}

export function ModelHeader({ detail, projectHref }: Props) {
  const { model, project, cover } = detail
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
            Modelo de{' '}
            <Link href={projectHref} className="text-zinc-700 hover:text-zinc-900 hover:underline">
              {project.name}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {model.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {stageLabel(project.stage)}
            </span>
          </div>
          {model.description && (
            <p className="mt-4 max-w-2xl text-base text-zinc-600">{model.description}</p>
          )}
        </div>

        <div className="shrink-0">
          <p className="text-sm text-zinc-500">Desde</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {formatPriceFrom(model.price_from, project.base_currency)}
          </p>
        </div>
      </div>
    </section>
  )
}
