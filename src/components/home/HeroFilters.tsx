'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Building2, Calculator, ChevronDown, House, Search } from 'lucide-react'
import { EMPTY_FILTERS, type Filters } from '@/lib/filters/parse'
import type { Database } from '@/lib/database.types'
import { CtaButton } from '@/components/ui/cta-button'
import { pushEvent } from '@/lib/gtm'
import { ZonaMultiSelect } from './ZonaMultiSelect'
import { DormitoriosSelect } from './DormitoriosSelect'

type Stage = Database['public']['Enums']['project_stage']
type Tipo = Database['public']['Enums']['property_type']

interface Option {
  slug: string
  name: string
}

interface Props {
  initial: Filters
  zoneOptions: Option[]
  departmentOptions: Option[]
  municipalityOptions: Option[]
}

const STAGE_LABEL: Record<Stage, string> = {
  lanzamiento: 'Lanzamiento',
  preventa: 'Preventa',
  construccion: 'Construcción',
  entrega_inmediata: 'Entrega inmediata',
}

const TIPO_CHIPS: { value: Tipo | null; label: string; icon?: ReactNode }[] = [
  { value: null, label: 'Todos' },
  { value: 'apartamento', label: 'Apartamentos', icon: <Building2 className="h-3.5 w-3.5" /> },
  { value: 'casa', label: 'Casas', icon: <House className="h-3.5 w-3.5" /> },
]

const SELECT_BASE =
  'h-11 w-full appearance-none rounded-full border border-hairline bg-white pl-4 pr-9 text-sm text-ink transition hover:border-brand-purple focus:border-brand-purple focus:outline-none'

const INPUT_BASE =
  'h-11 w-full rounded-full border border-hairline bg-white px-4 text-sm text-ink transition placeholder:text-muted-ink hover:border-brand-purple focus:border-brand-purple focus:outline-none'

const EYEBROW = 'text-[11px] font-medium uppercase tracking-[0.06em] text-muted-ink'

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={EYEBROW}>{label}</span>
      <div className="relative">
        <select className={SELECT_BASE} value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
      </div>
    </label>
  )
}

export function HeroFilters({
  initial,
  zoneOptions,
  departmentOptions,
  municipalityOptions,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<Filters>(initial)
  const [expanded, setExpanded] = useState(false)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    pushEvent('search', {
      tipo: state.tipo,
      zonas: state.zonas,
      precio_min: state.precio_min,
      precio_max: state.precio_max,
      etapa: state.etapa,
      dormitorios: state.dormitorios,
      q: state.q,
    })
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    if (state.tipo) p.set('tipo', state.tipo)
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
      className="w-full rounded-3xl bg-white/95 p-6 shadow-[0_20px_50px_-12px_rgba(20,16,80,0.25)] ring-1 ring-white/40 backdrop-blur"
    >
      {/* Top bar: tipo chips + calculadora link */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {TIPO_CHIPS.map(({ value, label, icon }) => {
            const active = state.tipo === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => set('tipo', value)}
                className={`flex cursor-pointer items-center gap-1.5 h-9 rounded-full px-5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'border border-hairline bg-white text-ink hover:border-brand-purple hover:text-brand-purple'
                }`}
              >
                {icon}
                {label}
              </button>
            )
          })}
        </div>
        <a
          href="/calculadora"
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple transition hover:text-brand-purple/70"
        >
          <Calculator className="h-4 w-4 shrink-0" />
          Buscar por cuota mensual
        </a>
      </div>

      <div className="mb-5 border-t border-hairline" />

      {/* Project name search */}
      <label className="mb-4 flex flex-col gap-1.5">
        <span className={EYEBROW}>Nombre del proyecto</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
          <input
            type="text"
            placeholder="Buscar por nombre de proyecto..."
            className={`${INPUT_BASE} pl-10`}
            value={state.q ?? ''}
            onChange={(e) => set('q', e.target.value.trim() || null)}
          />
        </div>
      </label>

      {/* Primary row: Zona · Dormitorios · Precio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className={EYEBROW}>Zonas</span>
          <ZonaMultiSelect
            options={zoneOptions}
            value={state.zonas}
            onChange={(v) => set('zonas', v)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={EYEBROW}>Dormitorios</span>
          <DormitoriosSelect
            value={state.dormitorios}
            onChange={(v) => set('dormitorios', v)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={EYEBROW}>Precio (USD)</span>
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-sm text-muted-ink">$</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Mín"
                className={`${INPUT_BASE} pl-7 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                value={state.precio_min ?? ''}
                onChange={(e) =>
                  set('precio_min', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
            <span className="shrink-0 text-sm text-muted-ink">–</span>
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-sm text-muted-ink">$</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Máx"
                className={`${INPUT_BASE} pl-7 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                value={state.precio_max ?? ''}
                onChange={(e) =>
                  set('precio_max', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </div>
        </label>
      </div>

      {/* Más filtros toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-purple transition hover:text-brand-purple/70"
      >
        {expanded ? 'Menos filtros' : 'Más filtros'}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable secondary row */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField
              label="Departamento"
              value={state.departamento ?? ''}
              onChange={(v) => set('departamento', v || null)}
            >
              <option value="">Todos</option>
              {departmentOptions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Municipio"
              value={state.municipio ?? ''}
              onChange={(v) => set('municipio', v || null)}
            >
              <option value="">Todos</option>
              {municipalityOptions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Etapa"
              value={state.etapa ?? ''}
              onChange={(v) => set('etapa', (v || null) as Stage | null)}
            >
              <option value="">Todas</option>
              {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-5">
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-sm font-medium text-muted-ink transition hover:text-ink"
        >
          Limpiar filtros
        </button>
        <CtaButton type="submit">Buscar</CtaButton>
      </div>
    </form>
  )
}
