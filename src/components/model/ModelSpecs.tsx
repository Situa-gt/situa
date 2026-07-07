import { FontAwesomeIcon, type FontAwesomeIconName } from '@/components/ui/font-awesome-icon'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']

interface Props {
  model: ModelRow
}

interface Spec {
  label: string
  value: string
  icon: FontAwesomeIconName
}

export function ModelSpecs({ model }: Props) {
  const specs: Spec[] = []
  if (model.size_m2 !== null)
    specs.push({ label: 'Área', value: `${model.size_m2} m²`, icon: 'ruler' })
  if (model.bedrooms !== null)
    specs.push({ label: 'Dormitorios', value: String(model.bedrooms), icon: 'bed' })
  if (model.bathrooms !== null)
    specs.push({ label: 'Baños', value: String(model.bathrooms), icon: 'bath' })
  specs.push({ label: 'Parqueo', value: String(model.parking_spots), icon: 'square-parking' })
  if (model.has_service_room)
    specs.push({ label: 'Cuarto de servicio', value: '', icon: 'people-roof' })

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Características del modelo
      </h2>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {specs.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <FontAwesomeIcon
                name={s.icon}
                className="h-5 w-5 opacity-90"
              />
            </span>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
                {s.label}
              </dt>
              {s.value && <dd className="mt-0.5 text-lg font-semibold text-ink">{s.value}</dd>}
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
