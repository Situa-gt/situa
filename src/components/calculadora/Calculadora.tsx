'use client'

import { useRef, useState, useTransition } from 'react'
import { Info } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { CtaButton } from '@/components/ui/cta-button'
import { ProjectCard } from '@/components/project/ProjectCard'
import { formatPriceValue } from '@/lib/format/price'
import { fetchAllActiveProjects } from '@/app/actions/calculadora'
import type { ProjectCardData } from '@/lib/queries/home'

type Currency = 'USD' | 'GTQ'

const EXCHANGE_RATE = 7.7

const RANGES = {
  USD: { min: 50_000, max: 1_500_000, step: 10_000, default: 250_000 },
  GTQ: { min: 400_000, max: 12_000_000, step: 100_000, default: 2_000_000 },
} as const

const INCOME_MIN = { USD: 400, GTQ: 3_000 } as const
const TERM_OPTIONS = [5, 10, 15, 20, 25, 30] as const

const INPUT_BASE =
  'h-11 rounded-full border border-hairline bg-white text-sm text-ink placeholder:text-muted-ink transition hover:border-brand-purple focus:border-brand-purple focus:outline-none'

function calcMonthlyPayment(loanAmount: number, annualRate: number, years: number): number {
  const n = years * 12
  if (annualRate === 0) return loanAmount / n
  const r = annualRate / 100 / 12
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function toPriceInUSD(price: number, projectCurrency: Currency, projectExchangeRate: number): number {
  if (projectCurrency === 'USD') return price
  return price / projectExchangeRate
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex cursor-help">
      <Info className="h-3.5 w-3.5 text-muted-ink" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-52 -translate-x-1/2 rounded-xl bg-zinc-900 px-3 py-2 text-center text-xs leading-relaxed text-white shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center text-sm font-medium text-ink">
      {children}
    </span>
  )
}

interface OutputItemProps {
  label: string
  value: string
  highlight?: boolean
}

function OutputItem({ label, value, highlight = false }: OutputItemProps) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-brand-purple text-white' : 'bg-zinc-50'}`}>
      <p className={`text-xs font-medium uppercase tracking-[0.06em] ${highlight ? 'text-white/70' : 'text-muted-ink'}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${highlight ? 'text-white' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

const TOGGLE_BTN = 'h-7 cursor-pointer px-3 text-xs font-medium rounded-full transition-colors'

export function Calculadora() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [income, setIncome] = useState('')
  const [propertyPrice, setPropertyPrice] = useState<number>(RANGES.USD.default)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [termYears, setTermYears] = useState<number>(25)
  const [interestRate, setInterestRate] = useState('8.0')
  const [results, setResults] = useState<ProjectCardData[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const resultsRef = useRef<HTMLDivElement>(null)

  const range = RANGES[currency]
  const rate = parseFloat(interestRate) || 0
  const loanAmount = propertyPrice * (1 - downPaymentPct / 100)
  const enganche = propertyPrice * (downPaymentPct / 100)
  const monthlyPayment = calcMonthlyPayment(loanAmount, rate, termYears)

  const allValuesSet = propertyPrice > 0 && downPaymentPct > 0 && termYears > 0 && rate >= 0

  function handleCurrencySwitch(next: Currency) {
    if (next === currency) return
    const converted =
      next === 'GTQ'
        ? Math.round((propertyPrice * EXCHANGE_RATE) / RANGES.GTQ.step) * RANGES.GTQ.step
        : Math.round((propertyPrice / EXCHANGE_RATE) / RANGES.USD.step) * RANGES.USD.step
    setPropertyPrice(converted)
    setCurrency(next)
    setResults(null)
  }

  function sliderVal(val: number | readonly number[]): number {
    return typeof val === 'number' ? val : (val as readonly number[])[0] ?? 0
  }

  function handleIncomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setIncome(raw)
  }

  function handleRateBlur() {
    const n = parseFloat(interestRate)
    if (!isNaN(n)) setInterestRate(n.toFixed(1))
  }

  function handleSearch() {
    startTransition(async () => {
      try {
        const all = await fetchAllActiveProjects()
        const propertyPriceUSD =
          currency === 'USD' ? propertyPrice : propertyPrice / EXCHANGE_RATE

        const filtered = all.filter((p) => {
          if (p.price_from === null) return false
          const priceUSD = toPriceInUSD(p.price_from, p.base_currency, EXCHANGE_RATE)
          return priceUSD <= propertyPriceUSD
        })

        setResults(filtered)
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } catch {
        setResults([])
      }
    })
  }

  const sym = currency === 'USD' ? '$' : 'Q'
  const incomeMin = INCOME_MIN[currency]

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      {/* ── Two-column calculator layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        {/* ── Inputs ──────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Currency switcher */}
          <div>
            <FieldLabel>Moneda</FieldLabel>
            <div
              role="group"
              aria-label="Cambiar moneda"
              className="mt-2 inline-flex items-center rounded-full bg-zinc-100 p-1"
            >
              <button
                type="button"
                onClick={() => handleCurrencySwitch('USD')}
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
                onClick={() => handleCurrencySwitch('GTQ')}
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

          {/* Income */}
          <div>
            <FieldLabel>
              Ingreso familiar mensual
              <Tooltip text="Cuánto ganas al mes (opcional si ya tienes crédito aprobado)." />
            </FieldLabel>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-muted-ink">
                {sym}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={income ? parseInt(income).toLocaleString('en-US') : ''}
                onChange={handleIncomeChange}
                placeholder={incomeMin.toLocaleString('en-US')}
                className={`${INPUT_BASE} w-full pl-8 pr-4 sm:max-w-xs`}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-ink">
              Mínimo recomendado: {sym}{incomeMin.toLocaleString('en-US')}/mes
            </p>
          </div>

          {/* Property price slider */}
          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>
                Precio estimado del inmueble
                <Tooltip text="Es el precio total de venta del inmueble que deseas adquirir." />
              </FieldLabel>
              <span className="text-sm font-semibold text-brand-purple">
                {formatPriceValue(propertyPrice, currency)}
              </span>
            </div>
            <Slider
              min={range.min}
              max={range.max}
              step={range.step}
              value={[propertyPrice]}
              onValueChange={(v) => { setPropertyPrice(sliderVal(v)); setResults(null) }}
              className="mt-4"
            />
            <div className="mt-1.5 flex justify-between text-xs text-muted-ink">
              <span>{sym}{(range.min / 1000).toLocaleString('en-US')}K</span>
              <span>
                {currency === 'USD'
                  ? '$1.5M'
                  : `Q${(range.max / 1_000_000).toFixed(0)}M`}
              </span>
            </div>
          </div>

          {/* Down payment slider */}
          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>
                Enganche
                <Tooltip text="Porcentaje del precio total que pagas de entrada. A mayor enganche, menor cuota mensual." />
              </FieldLabel>
              <span className="text-sm font-semibold text-brand-purple">{downPaymentPct}%</span>
            </div>
            <Slider
              min={5}
              max={90}
              step={1}
              value={[downPaymentPct]}
              onValueChange={(v) => { setDownPaymentPct(sliderVal(v)); setResults(null) }}
              className="mt-4"
            />
            <div className="mt-1.5 flex justify-between text-xs text-muted-ink">
              <span>5%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Term pills */}
          <div>
            <FieldLabel>
              Plazo del crédito
              <Tooltip text="Elige por cuánto tiempo quieres pagar tu préstamo." />
            </FieldLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {TERM_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setTermYears(y); setResults(null) }}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    termYears === y
                      ? 'bg-brand-purple text-white'
                      : 'bg-zinc-100 text-ink hover:bg-zinc-200'
                  }`}
                >
                  {y} años
                </button>
              ))}
            </div>
          </div>

          {/* Interest rate */}
          <div>
            <FieldLabel>
              Tasa de interés anual
              <Tooltip text="Personaliza tu simulación si ya tienes una tasa ofrecida por tu banco." />
            </FieldLabel>
            <div className="relative mt-2 w-fit">
              <input
                type="text"
                inputMode="decimal"
                value={interestRate}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.]/g, '')
                  setInterestRate(raw)
                  setResults(null)
                }}
                onBlur={handleRateBlur}
                className={`${INPUT_BASE} w-28 pl-4 pr-8`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-ink">
                %
              </span>
            </div>
          </div>
        </div>

        {/* ── Output card ─────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_28px_-8px_rgba(20,16,80,0.10)]">
            <h2 className="text-base font-semibold text-ink">Tu simulación</h2>
            <p className="mt-0.5 text-xs text-muted-ink">
              Resultados estimados — sujetos a aprobación bancaria
            </p>

            <div className="mt-6 space-y-3">
              <OutputItem
                label="Cuota mensual aproximada"
                value={allValuesSet ? formatPriceValue(monthlyPayment, currency) + '/mes' : '—'}
                highlight
              />
              <OutputItem
                label="Valor del enganche"
                value={allValuesSet ? formatPriceValue(enganche, currency) : '—'}
              />
              <OutputItem
                label="Monto a financiar"
                value={allValuesSet ? formatPriceValue(loanAmount, currency) : '—'}
              />
            </div>

            <div className="mt-6">
              <CtaButton
                type="button"
                onClick={handleSearch}
                disabled={!allValuesSet || isPending}
                className="w-full justify-center"
              >
                {isPending ? 'Buscando…' : 'Buscar proyectos con esta cuota'}
              </CtaButton>
            </div>

            <p className="mt-4 text-center text-xs text-muted-ink">
              Simulación orientativa. Consulta a tu banco para condiciones exactas.
            </p>
          </div>
        </div>
      </div>

      {/* ── Results section ─────────────────────────────────────────────── */}
      {results !== null && (
        <div ref={resultsRef} className="mt-20 scroll-mt-28">
          <div className="mb-8 border-t border-border pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {results.length > 0
                ? `Proyectos con cuota de ${formatPriceValue(monthlyPayment, currency)}/mes o menos`
                : 'Sin resultados para esta simulación'}
            </h2>
            {results.length > 0 && (
              <p className="mt-1 text-sm text-muted-ink">
                {results.length} {results.length === 1 ? 'proyecto encontrado' : 'proyectos encontrados'}
              </p>
            )}
            {results.length === 0 && (
              <p className="mt-2 text-sm text-muted-ink">
                Intenta aumentar el precio del inmueble o ajustar el enganche.
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((project, i) => (
                <ProjectCard key={project.id} project={project} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
