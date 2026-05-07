import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { formatPriceFrom } from '@/lib/format/price'
import type { Database } from '@/lib/database.types'

type ModelRow = Database['public']['Tables']['models']['Row']
type Currency = Database['public']['Enums']['currency_code']

interface Props {
  model: ModelRow
  currency: Currency
  basePath: string
}

export function ModelCard({ model, currency, basePath }: Props) {
  const href = `${basePath}/${model.slug}`

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-900">{model.name}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-900" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-600">
        {model.size_m2 !== null && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Área</dt>
            <dd>{model.size_m2} m²</dd>
          </div>
        )}
        {model.bedrooms !== null && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Dorm.</dt>
            <dd>{model.bedrooms}</dd>
          </div>
        )}
        {model.bathrooms !== null && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Baños</dt>
            <dd>{model.bathrooms}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-400">Parqueo</dt>
          <dd>{model.parking_spots}</dd>
        </div>
      </dl>

      <p className="mt-5 text-base font-semibold text-zinc-900">
        {formatPriceFrom(model.price_from, currency)}
      </p>
    </Link>
  )
}
