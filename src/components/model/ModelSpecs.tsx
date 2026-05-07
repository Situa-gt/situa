import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']

interface Props {
  model: ModelRow
}

interface Spec {
  label: string
  value: string
}

export function ModelSpecs({ model }: Props) {
  const specs: Spec[] = []
  if (model.size_m2 !== null) specs.push({ label: 'Área', value: `${model.size_m2} m²` })
  if (model.bedrooms !== null) specs.push({ label: 'Dormitorios', value: String(model.bedrooms) })
  if (model.bathrooms !== null) specs.push({ label: 'Baños', value: String(model.bathrooms) })
  specs.push({ label: 'Parqueo', value: String(model.parking_spots) })

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-10">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
        Características del modelo
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {specs.map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
