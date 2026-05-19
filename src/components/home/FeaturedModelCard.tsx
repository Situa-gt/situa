import Image from 'next/image'
import Link from 'next/link'
import { tipoSlug } from '@/lib/types/property'
import { formatPriceValue, estimateMonthlyPayment } from '@/lib/format/price'
import type { FeaturedModelCardData } from '@/lib/queries/home'

interface Props {
  model: FeaturedModelCardData
}

export function FeaturedModelCard({ model }: Props) {
  const { project, zone } = model
  const href = zone
    ? `/${zone.url_slug}/${tipoSlug(project.property_type)}/${project.slug}/${model.slug}`
    : `#`
  const modelName = model.name.trim().length === 1 ? `Modelo ${model.name}` : model.name
  const monthly = model.monthly_payment_from ?? estimateMonthlyPayment(model.price_from)

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white transition hover:border-brand-purple hover:shadow-[0_12px_32px_-12px_rgba(107,102,235,0.25)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {model.cover_url ? (
          <Image
            src={model.cover_url}
            alt={model.cover_alt ?? `Imagen del modelo ${model.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.1em] text-muted-ink">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium text-muted-ink">{project.name}</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">{modelName}</h3>

        <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
              Precio desde
            </dt>
            <dd className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
              {formatPriceValue(model.price_from, project.base_currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
              Cuota desde
            </dt>
            <dd className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
              {formatPriceValue(monthly, project.base_currency)}
              <span className="ml-0.5 text-sm font-normal text-muted-ink">/mes</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
              Dormitorios
            </dt>
            <dd className="mt-1.5">
              {model.bedrooms !== null ? (
                <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-1 text-sm font-semibold text-brand-purple">
                  {model.bedrooms}
                </span>
              ) : (
                <span className="text-xl font-semibold tracking-tight text-ink">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  )
}
