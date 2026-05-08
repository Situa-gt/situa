import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import type { ModelDetailData } from '@/lib/queries/model'

interface Props {
  detail: ModelDetailData
  projectHref: string
}

export function ModelHeaderInfo({ detail, projectHref }: Props) {
  const { model, project, projectLogo } = detail
  const modelName = model.name.trim().length === 1 ? `Modelo ${model.name}` : model.name
  return (
    <div>
      {/* Back to project card */}
      <Link
        href={projectHref}
        className="group flex items-center gap-4 rounded-2xl border border-hairline bg-white p-4 shadow-sm transition hover:border-brand-purple hover:shadow-md"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-muted-ink transition group-hover:bg-brand-purple group-hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {projectLogo && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-white">
              <Image
                src={projectLogo}
                alt={`Logo de ${project.name}`}
                fill
                sizes="40px"
                className="object-contain p-0.5"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-ink">
              Regresar a
            </p>
            <p className="truncate text-sm font-semibold text-ink">{project.name}</p>
          </div>
        </div>
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl">
          {modelName}
        </h1>
      </div>

      {model.description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-body">
          {model.description}
        </p>
      )}

    </div>
  )
}
