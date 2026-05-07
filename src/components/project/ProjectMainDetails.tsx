'use client'

import { useState } from 'react'
import {
  convertPrice,
  estimateMonthlyPayment,
  formatPriceValue,
} from '@/lib/format/price'
import type { Database } from '@/lib/database.types'

type Currency = Database['public']['Enums']['currency_code']
type ModelRow = Database['public']['Tables']['models']['Row']

interface Props {
  baseCurrency: Currency
  exchangeRate: number
  priceFrom: number | null
  models: ModelRow[]
}

function bedroomsRange(models: ModelRow[]): string | null {
  const values = models
    .map((m) => m.bedrooms)
    .filter((b): b is number => b !== null)
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return `${min}`
  return `${min}–${max}`
}

const TOGGLE_BTN =
  'h-7 px-3 text-xs font-medium rounded-full transition-colors'

export function ProjectMainDetails({
  baseCurrency,
  exchangeRate,
  priceFrom,
  models,
}: Props) {
  const [currency, setCurrency] = useState<Currency>(baseCurrency)
  const range = bedroomsRange(models)

  const priceConverted =
    priceFrom !== null
      ? convertPrice(priceFrom, baseCurrency, currency, exchangeRate)
      : null
  const monthly =
    priceConverted !== null ? estimateMonthlyPayment(priceConverted) : null

  return (
    <div className="border-t border-hairline pt-6">
      <div className="flex items-center justify-start">
        <div
          role="group"
          aria-label="Cambiar moneda"
          className="inline-flex items-center rounded-full bg-zinc-100 p-1"
        >
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            aria-pressed={currency === 'USD'}
            className={`${TOGGLE_BTN} ${
              currency === 'USD'
                ? 'bg-white text-brand-purple shadow-sm'
                : 'text-muted-ink hover:text-ink'
            }`}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency('GTQ')}
            aria-pressed={currency === 'GTQ'}
            className={`${TOGGLE_BTN} ${
              currency === 'GTQ'
                ? 'bg-white text-brand-purple shadow-sm'
                : 'text-muted-ink hover:text-ink'
            }`}
          >
            GTQ
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
            Precios desde
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {priceConverted !== null
              ? formatPriceValue(priceConverted, currency)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
            Cuotas desde
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {monthly !== null ? formatPriceValue(monthly, currency) : '—'}
            <span className="ml-1 text-sm font-normal text-muted-ink">/mes</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
            Dormitorios
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {range ?? '—'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
