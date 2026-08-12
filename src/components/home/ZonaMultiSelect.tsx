'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface Option {
  slug: string
  name: string
}

interface Props {
  options: Option[]
  value: string[]
  onChange: (v: string[]) => void
  inlineDropdown?: boolean
}

export function ZonaMultiSelect({ options, value, onChange, inlineDropdown = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  const toggle = (slug: string) => {
    onChange(value.includes(slug) ? value.filter((z) => z !== slug) : [...value, slug])
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const label =
    value.length === 0
      ? 'Todas'
      : value.length === 1
        ? (options.find((o) => o.slug === value[0])?.name ?? '1 zona')
        : `${value.length} zonas`

  const hasSelection = value.length > 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-full border px-4 text-sm transition hover:border-brand-purple ${
          open || hasSelection
            ? 'border-brand-purple bg-white'
            : 'border-hairline bg-white'
        }`}
      >
        <span className={hasSelection ? 'font-medium text-brand-purple' : 'text-ink'}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {hasSelection && (
            <span
              role="button"
              aria-label="Limpiar zonas"
              onClick={clear}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple transition hover:bg-brand-purple/20"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-ink transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div
          className={`z-[600] w-[min(420px,calc(100vw-2rem))] min-w-[260px] rounded-[1.75rem] border border-hairline bg-white p-3 shadow-[0_28px_70px_-26px_rgba(20,16,80,0.45)] ${
            inlineDropdown
              ? 'mt-2'
              : 'absolute left-0 top-[calc(100%+6px)]'
          }`}
        >
          <div className="zone-popover-scroll max-h-[420px] overflow-y-auto pr-2">
            <p className="px-2 pb-3 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-ink">
              Selecciona una zona
            </p>
            {options.map((o) => {
              const selected = value.includes(o.slug)
              return (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => toggle(o.slug)}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl px-2 py-2.5 text-left transition hover:bg-zinc-50 ${
                    selected ? 'bg-brand-purple/5' : ''
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-sm font-semibold text-brand-purple">
                    {o.name.replace('Zona ', '')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? 'text-brand-purple' : 'text-ink'
                      }`}
                    >
                      {o.name}
                    </span>
                    <span className="block text-xs text-muted-ink">
                      Proyectos disponibles en esta zona
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-brand-purple" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
