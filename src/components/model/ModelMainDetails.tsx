'use client'

import { useState } from 'react'
import { convertPrice, formatPriceValue } from '@/lib/format/price'
import type { Database } from '@/lib/database.types'

type Currency = Database['public']['Enums']['currency_code']
type ModelRow = Database['public']['Tables']['models']['Row']

interface Props {
  model: ModelRow
  baseCurrency: Currency
  exchangeRate: number
}

const TOGGLE_BTN =
  'h-7 px-3 text-xs font-medium rounded-full transition-colors cursor-pointer'

export function ModelMainDetails({ model, baseCurrency, exchangeRate }: Props) {
  const [currency, setCurrency] = useState<Currency>(baseCurrency)

  const priceConverted = convertPrice(
    model.price_from,
    baseCurrency,
    currency,
    exchangeRate,
  )
  const monthly =
    model.monthly_payment_from !== null
      ? convertPrice(model.monthly_payment_from, baseCurrency, currency, exchangeRate)
      : null

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

      <dl className={`mt-4 grid grid-cols-1 gap-6 ${monthly !== null ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
            Precio desde
          </dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {formatPriceValue(priceConverted, currency)}
          </dd>
        </div>
        {monthly !== null && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
              Cuotas desde
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {formatPriceValue(monthly, currency)}
              <span className="ml-1 text-sm font-normal text-muted-ink">/mes</span>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
