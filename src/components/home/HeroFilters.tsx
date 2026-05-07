'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { buildSearchUrl } from '@/lib/url/build-search-url'
import { EMPTY_FILTERS, type Filters } from '@/lib/filters/parse'
import type { Database } from '@/lib/database.types'

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

const TIPO_LABEL: Record<Tipo, string> = {
  apartamento: 'Apartamentos',
  casa: 'Casas',
}

const SELECT_BASE =
  'h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900'

export function HeroFilters({
  initial,
  zoneOptions,
  departmentOptions,
  municipalityOptions,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<Filters>(initial)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(buildSearchUrl(state))
  }

  const onClear = () => {
    setState(EMPTY_FILTERS)
    router.push('/')
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full grid-cols-1 gap-3 rounded-xl bg-white/95 p-5 shadow-lg ring-1 ring-zinc-200 backdrop-blur sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Tipo
        <select
          className={SELECT_BASE}
          value={state.tipo ?? ''}
          onChange={(e) => set('tipo', (e.target.value || null) as Tipo | null)}
        >
          <option value="">Todos</option>
          {(Object.keys(TIPO_LABEL) as Tipo[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Departamento
        <select
          className={SELECT_BASE}
          value={state.departamento ?? ''}
          onChange={(e) => set('departamento', e.target.value || null)}
        >
          <option value="">Todos</option>
          {departmentOptions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Municipio
        <select
          className={SELECT_BASE}
          value={state.municipio ?? ''}
          onChange={(e) => set('municipio', e.target.value || null)}
        >
          <option value="">Todos</option>
          {municipalityOptions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Zona
        <select
          className={SELECT_BASE}
          value={state.zona ?? ''}
          onChange={(e) => set('zona', e.target.value || null)}
        >
          <option value="">Todas</option>
          {zoneOptions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Precio mín. (USD)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={SELECT_BASE}
          value={state.precio_min ?? ''}
          onChange={(e) =>
            set('precio_min', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Precio máx. (USD)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={SELECT_BASE}
          value={state.precio_max ?? ''}
          onChange={(e) =>
            set('precio_max', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Etapa
        <select
          className={SELECT_BASE}
          value={state.etapa ?? ''}
          onChange={(e) => set('etapa', (e.target.value || null) as Stage | null)}
        >
          <option value="">Todas</option>
          {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
        Dormitorios
        <select
          className={SELECT_BASE}
          value={state.dormitorios ?? ''}
          onChange={(e) =>
            set('dormitorios', e.target.value === '' ? null : Number(e.target.value))
          }
        >
          <option value="">Todos</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </label>

      <div className="col-span-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end lg:col-span-4">
        <button
          type="submit"
          className="h-10 flex-1 rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={onClear}
          className="h-10 rounded-md border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          Limpiar filtros
        </button>
      </div>
    </form>
  )
}
