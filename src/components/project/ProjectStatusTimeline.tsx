import { Check } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['project_stage']

interface Props {
  current: Stage
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'lanzamiento', label: 'Lanzamiento' },
  { id: 'preventa', label: 'Preventa' },
  { id: 'construccion', label: 'En construcción' },
  { id: 'entrega_inmediata', label: 'Entrega inmediata' },
]

export function ProjectStatusTimeline({ current }: Props) {
  const currentIndex = STAGES.findIndex((s) => s.id === current)

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Estado actual del proyecto
      </h2>

      <ol className="mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
        {STAGES.map((s, idx) => {
          const isPast = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isLast = idx === STAGES.length - 1

          const dotClass = isCurrent
            ? 'bg-brand-orange text-white animate-brand-glow'
            : isPast
              ? 'bg-brand-purple text-white'
              : 'bg-zinc-100 text-muted-ink'

          const labelClass = isCurrent
            ? 'text-brand-orange font-semibold'
            : isPast
              ? 'text-ink font-medium'
              : 'text-muted-ink'

          const lineClass = isPast
            ? 'bg-brand-purple'
            : isCurrent
              ? 'bg-gradient-to-r from-brand-purple to-zinc-200'
              : 'bg-zinc-200'

          return (
            <li key={s.id} className="relative flex flex-col items-center text-center">
              {/* Connector line — sits behind the dot, runs to the next item */}
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-5 hidden h-0.5 w-full sm:block ${lineClass}`}
                />
              )}
              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${dotClass}`}
              >
                {isPast ? <Check className="h-4 w-4" strokeWidth={2.5} /> : idx + 1}
              </span>
              <span className={`mt-3 text-sm ${labelClass}`}>{s.label}</span>
              {isCurrent && (
                <span className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-brand-orange">
                  Actual
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
