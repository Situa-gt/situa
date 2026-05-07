import { stageLabel } from '@/lib/format/stage'
import type { ProjectDetailData } from '@/lib/queries/project'

interface Props {
  detail: ProjectDetailData
  zoneName: string
}

export function ProjectHeaderInfo({ detail, zoneName }: Props) {
  const { project, developer } = detail
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-ink">
        {zoneName}
        {developer && <> · {developer.name}</>}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl">
        {project.name}
      </h1>
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
    </div>
  )
}
