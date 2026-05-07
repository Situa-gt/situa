import Link from 'next/link'
import { stageLabel } from '@/lib/format/stage'
import type { ModelDetailData } from '@/lib/queries/model'

interface Props {
  detail: ModelDetailData
  projectHref: string
}

export function ModelHeaderInfo({ detail, projectHref }: Props) {
  const { model, project } = detail
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-ink">
        Modelo de{' '}
        <Link
          href={projectHref}
          className="text-ink transition hover:text-brand-purple"
        >
          {project.name}
        </Link>
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl">
        {model.name}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple">
          {stageLabel(project.stage)}
        </span>
      </div>
      {model.description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-body">
          {model.description}
        </p>
      )}
    </div>
  )
}
