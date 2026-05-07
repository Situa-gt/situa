import type { Database } from '@/lib/database.types'

type Currency = Database['public']['Enums']['currency_code']

export function formatPriceFrom(value: number, currency: Currency): string {
  const rounded = Math.round(value)
  const formatted = rounded.toLocaleString('en-US')
  const symbol = currency === 'USD' ? '$' : 'Q'
  return `Desde ${symbol}${formatted}`
}
