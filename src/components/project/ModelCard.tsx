import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon'
import { formatPriceValue } from '@/lib/format/price'
import type { ProjectGalleryImage } from '@/lib/queries/project'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type Currency = Database['public']['Enums']['currency_code']

interface Props {
  model: ModelRow
  currency: Currency
  basePath: string
  image?: ProjectGalleryImage | null
}

export function ModelCard({ model, currency, basePath, image }: Props) {
  const href = `${basePath}/${model.slug}`
  const modelName = model.name.trim().length === 1 ? `Modelo ${model.name}` : model.name

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white transition hover:border-brand-purple hover:shadow-[0_12px_32px_-12px_rgba(107,102,235,0.25)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? `Imagen del modelo ${model.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.1em] text-muted-ink">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight text-ink">
            {modelName}
          </h3>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-muted-ink transition group-hover:bg-brand-purple group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-body">
          {model.size_m2 !== null && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                <FontAwesomeIcon name="ruler" className="h-3.5 w-3.5 opacity-90 [filter:var(--amenity-icon-filter)]" />
              </span>
              <div>
              <dt className="text-xs uppercase tracking-[0.06em] text-muted-ink">Área</dt>
              <dd className="mt-0.5 font-medium text-ink">{model.size_m2} m²</dd>
              </div>
            </div>
          )}
          {model.bedrooms !== null && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                <FontAwesomeIcon name="bed" className="h-3.5 w-3.5 opacity-90 [filter:var(--amenity-icon-filter)]" />
              </span>
              <div>
              <dt className="text-xs uppercase tracking-[0.06em] text-muted-ink">Dorm.</dt>
              <dd className="mt-0.5 font-medium text-ink">{model.bedrooms}</dd>
              </div>
            </div>
          )}
          {model.bathrooms !== null && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                <FontAwesomeIcon name="bath" className="h-3.5 w-3.5 opacity-90 [filter:var(--amenity-icon-filter)]" />
              </span>
              <div>
              <dt className="text-xs uppercase tracking-[0.06em] text-muted-ink">Baños</dt>
              <dd className="mt-0.5 font-medium text-ink">{model.bathrooms}</dd>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <FontAwesomeIcon name="square-parking" className="h-3.5 w-3.5 opacity-90 [filter:var(--amenity-icon-filter)]" />
            </span>
            <div>
            <dt className="text-xs uppercase tracking-[0.06em] text-muted-ink">Parqueo</dt>
            <dd className="mt-0.5 font-medium text-ink">{model.parking_spots}</dd>
            </div>
          </div>
        </dl>

        <div className={`mt-auto grid gap-4 pt-6 ${model.monthly_payment_from !== null ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <span className="block text-[11px] uppercase tracking-[0.06em] text-muted-ink">
              Desde
            </span>
            <span className="mt-0.5 block text-base font-semibold text-ink">
              {formatPriceValue(model.price_from, currency)}
            </span>
          </div>
          {model.monthly_payment_from !== null && (
            <div>
              <span className="block text-[11px] uppercase tracking-[0.06em] text-muted-ink">
                Cuotas desde
              </span>
              <span className="mt-0.5 block text-base font-semibold text-ink">
                {formatPriceValue(model.monthly_payment_from, currency)}
                <span className="ml-0.5 text-xs font-normal text-muted-ink">/mes</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
