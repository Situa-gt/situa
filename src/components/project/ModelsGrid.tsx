import { ModelCard } from '@/components/project/ModelCard'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type Currency = Database['public']['Enums']['currency_code']

interface Props {
  models: ModelRow[]
  currency: Currency
  basePath: string
}

export function ModelsGrid({ models, currency, basePath }: Props) {
  if (models.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Modelos disponibles
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} currency={currency} basePath={basePath} />
        ))}
      </div>
    </section>
  )
}
