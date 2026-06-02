import type { Database } from '@/lib/database.types'

type Currency = Database['public']['Enums']['currency_code']

export function formatPriceFrom(value: number, currency: Currency): string {
  const rounded = Math.round(value)
  const formatted = rounded.toLocaleString('en-US')
  const symbol = currency === 'USD' ? '$' : 'Q'
  return `Desde ${symbol}${formatted}`
}

export function formatPriceValue(value: number, currency: Currency): string {
  const rounded = Math.round(value)
  const formatted = rounded.toLocaleString('en-US')
  const symbol = currency === 'USD' ? '$' : 'Q'
  return `${symbol}${formatted}`
}

// Convert a base-currency value to the target currency using the project's exchange_rate.
// exchange_rate is GTQ-per-1-USD. base_currency tells us which way to convert.
export function convertPrice(
  value: number,
  baseCurrency: Currency,
  target: Currency,
  exchangeRate: number,
): number {
  if (baseCurrency === target) return value
  if (baseCurrency === 'USD' && target === 'GTQ') return value * exchangeRate
  return value / exchangeRate
}
