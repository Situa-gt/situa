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
}

export function ZonaMultiSelect({ options, value, onChange }: Props) {
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
        <div className="absolute left-0 top-[calc(100%+6px)] z-[200] w-full min-w-[180px] max-h-64 overflow-y-auto rounded-2xl border border-hairline bg-white py-1.5 shadow-[0_8px_24px_-4px_rgba(20,16,80,0.15)]">
          {options.map((o) => {
            const selected = value.includes(o.slug)
            return (
              <button
                key={o.slug}
                type="button"
                onClick={() => toggle(o.slug)}
                className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm transition hover:bg-brand-purple/5 ${
                  selected ? 'font-medium text-brand-purple' : 'text-ink'
                }`}
              >
                {o.name}
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-purple" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
