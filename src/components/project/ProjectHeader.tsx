import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { stageLabel } from '@/lib/format/stage'
import type { ProjectDetailData } from '@/lib/queries/project'

interface Props {
  detail: ProjectDetailData
  zoneName: string
}

export function ProjectHeaderInfo({ detail, zoneName }: Props) {
  const { project, developer, projectLogo, developerLogo } = detail
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-ink">
        {zoneName}
        {developer && <> · {developer.name}</>}
      </p>

      {/* Project name + logo */}
      <div className="mt-2 flex items-center gap-4">
        {projectLogo && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
            <Image
              src={projectLogo}
              alt={`Logo de ${project.name}`}
              fill
              sizes="56px"
              className="object-contain p-1"
            />
          </div>
        )}
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl">
          {project.name}
        </h1>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple">
          {stageLabel(project.stage)}
        </span>
      </div>

      {project.short_description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-body">
          {project.short_description}
        </p>
      )}

      {developer && (
        <div className="mt-6 border-t border-hairline pt-6">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Desarrolladora
          </h2>
          <div className="mt-4 flex items-center gap-4">
            {developerLogo ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-white">
                <Image
                  src={developerLogo}
                  alt={`Logo de ${developer.name}`}
                  fill
                  sizes="40px"
                  className="object-contain p-0.5"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-semibold text-brand-purple">
                {developer.name.charAt(0)}
              </div>
            )}
            <p className="text-sm font-semibold text-ink">{developer.name}</p>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verificado por Sitúa
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
