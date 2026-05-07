import { ModelCard } from '@/components/project/ModelCard'
import type { ProjectGalleryImage } from '@/lib/queries/project'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type Currency = Database['public']['Enums']['currency_code']

interface Props {
  models: ModelRow[]
  currency: Currency
  basePath: string
  title?: string
  images?: Record<string, ProjectGalleryImage>
}

export function ModelsGrid({
  models,
  currency,
  basePath,
  title = 'Modelos disponibles',
  images,
}: Props) {
  if (models.length === 0) return null

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            currency={currency}
            basePath={basePath}
            image={images?.[m.id] ?? null}
          />
        ))}
      </div>
    </section>
  )
}
