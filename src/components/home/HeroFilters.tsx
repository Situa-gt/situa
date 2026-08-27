'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { EMPTY_FILTERS, type Filters } from '@/lib/filters/parse'
import type { Database } from '@/lib/database.types'
import { pushEvent } from '@/lib/gtm'
import { trackEvent } from '@/lib/analytics'
import { ZonaMultiSelect } from './ZonaMultiSelect'
import { DormitoriosSelect } from './DormitoriosSelect'

type Stage = Database['public']['Enums']['project_stage']

interface Option {
  slug: string
  name: string
}

interface Props {
  initial: Filters
  zoneOptions: Option[]
  municipalityOptions: Option[]
}

const STAGE_LABEL: Record<Stage, string> = {
  lanzamiento: 'Lanzamiento',
  preventa: 'Preventa',
  construccion: 'Construcción',
  entrega_inmediata: 'Entrega inmediata',
}

const EYEBROW = 'text-[11px] font-medium uppercase tracking-[0.06em] text-muted-ink'

const hasGeographicChoice = (options: Option[]) => options.length >= 2

export function HeroFilters({
  initial,
  zoneOptions,
  municipalityOptions,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<Filters>(initial)
  const [expanded, setExpanded] = useState(false)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const filters = {
      zonas: state.zonas,
      precio_min: state.precio_min,
      precio_max: state.precio_max,
      etapa: state.etapa,
      dormitorios: state.dormitorios,
      q: state.q,
    }
    pushEvent('search', {
      ...filters,
      // GA4 event params can't hold arrays — flatten to comma-separated strings
      zonas: state.zonas.join(',') || undefined,
      dormitorios: state.dormitorios.join(',') || undefined,
      search_term: state.q || undefined,
    })
    trackEvent({ event_type: 'search', filters })
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    for (const z of state.zonas) p.append('zona', z)
    if (state.departamento) p.set('departamento', state.departamento)
    if (state.municipio) p.set('municipio', state.municipio)
    if (state.precio_min !== null) p.set('precio_min', String(state.precio_min))
    if (state.precio_max !== null) p.set('precio_max', String(state.precio_max))
    if (state.etapa) p.set('etapa', state.etapa)
    for (const d of state.dormitorios) p.append('dormitorios', String(d))
    const qs = p.toString()
    router.push(qs ? `/?${qs}#resultados` : '/')
  }

  const onClear = () => {
    setState(EMPTY_FILTERS)
    router.push('/')
  }

  return (
      <form
        onSubmit={onSubmit}
        className="relative z-[500] rounded-[2rem] border border-white/70 bg-white/95 shadow-[0_24px_70px_-34px_rgba(20,16,80,0.55)] backdrop-blur-xl"
      >
        <div className="grid grid-cols-1 divide-y divide-hairline lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:divide-x lg:divide-y-0">
          <label className="flex min-h-[74px] flex-col justify-center gap-1 px-6 py-4">
            <span className="text-sm font-semibold text-ink">Destino</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-purple" />
              <input
                type="text"
                placeholder="Proyecto, zona o ubicación"
                className="h-8 w-full bg-transparent pl-6 text-base text-ink outline-none placeholder:text-muted-ink"
                value={state.q ?? ''}
                onChange={(e) => set('q', e.target.value.trim() || null)}
              />
            </div>
          </label>

          <label className="flex min-h-[74px] flex-col justify-center gap-2 px-6 py-4">
            <span className="text-sm font-semibold text-ink">Zona</span>
            <ZonaMultiSelect
              options={zoneOptions}
              value={state.zonas}
              onChange={(v) => set('zonas', v)}
            />
          </label>

          <label className="flex min-h-[74px] flex-col justify-center gap-2 px-6 py-4">
            <span className="text-sm font-semibold text-ink">Precio</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Mín USD"
                className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-ink [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={state.precio_min ?? ''}
                onChange={(e) =>
                  set('precio_min', e.target.value === '' ? null : Number(e.target.value))
                }
              />
              <span className="text-muted-ink">-</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Máx"
                className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-ink [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={state.precio_max ?? ''}
                onChange={(e) =>
                  set('precio_max', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </label>

          <div className="flex items-center gap-3 px-4 py-4">
            <button
              type="submit"
              aria-label="Buscar proyectos"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-6 text-base font-semibold text-white shadow-[0_10px_24px_-12px_rgba(253,125,41,0.9)] transition hover:bg-brand-orange-hover lg:w-14 lg:px-0"
            >
              <Search className="h-5 w-5" />
              <span className="lg:hidden">Buscar</span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-6 py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-purple transition hover:text-brand-purple/75"
          >
            {expanded ? 'Ocultar filtros' : 'Más filtros'}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-muted-ink transition hover:text-ink"
          >
            Limpiar
          </button>
        </div>
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className={expanded ? 'overflow-visible' : 'overflow-hidden'}>
            <div className="grid grid-cols-1 gap-4 border-t border-hairline px-6 py-5 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={EYEBROW}>Dormitorios</span>
                <DormitoriosSelect
                  value={state.dormitorios}
                  onChange={(v) => set('dormitorios', v)}
                />
              </label>
              {hasGeographicChoice(municipalityOptions) ? (
                <SelectField
                  label="Municipio"
                  value={state.municipio ?? ''}
                  onChange={(v) => set('municipio', v || null)}
                  options={[{ slug: '', name: 'Todos' }, ...municipalityOptions]}
                />
              ) : null}
              <SelectField
                label="Etapa"
                value={state.etapa ?? ''}
                onChange={(v) => set('etapa', (v || null) as Stage | null)}
                options={[
                  { slug: '', name: 'Todas' },
                  ...(Object.keys(STAGE_LABEL) as Stage[]).map((s) => ({
                    slug: s,
                    name: STAGE_LABEL[s],
                  })),
                ]}
              />
            </div>
          </div>
        </div>
      </form>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.slug === value) ?? options[0]

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      <span className={EYEBROW}>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-full border bg-white px-4 text-sm transition hover:border-brand-purple ${
          open || value ? 'border-brand-purple' : 'border-hairline'
        }`}
      >
        <span className={value ? 'font-medium text-brand-purple' : 'text-ink'}>
          {selected?.name ?? 'Todos'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-ink transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[600] w-[min(360px,calc(100vw-2rem))] min-w-full rounded-[1.5rem] border border-hairline bg-white p-3 shadow-[0_28px_70px_-26px_rgba(20,16,80,0.45)]">
          <div className="zone-popover-scroll max-h-[320px] overflow-y-auto pr-2">
            <p className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-ink">
              {label}
            </p>
            {options.map((option) => {
              const isSelected = option.slug === value
              return (
                <button
                  key={option.slug || 'all'}
                  type="button"
                  onClick={() => {
                    onChange(option.slug)
                    setOpen(false)
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                    isSelected ? 'bg-brand-purple/5 font-semibold text-brand-purple' : 'text-ink'
                  }`}
                >
                  {option.name}
                  {isSelected && <span className="h-2 w-2 rounded-full bg-brand-purple" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
