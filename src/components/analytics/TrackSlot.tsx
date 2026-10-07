'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { trackEvent } from '@/lib/analytics'

/** Premium home spaces sold by Sitúa, plus the standard grid as a baseline. */
export type HomeSlot = 'vip' | 'plata' | 'bronce' | 'modelo' | 'estandar'

type TrackSlotProps = {
  slot: HomeSlot
  /** 1-based position inside the space. */
  position: number
  projectId?: string | null
  modelId?: string | null
  /** When false the impression waits (e.g. a slide that is not on screen yet). */
  active?: boolean
  className?: string
  children: ReactNode
}

const SEEN_KEY = 'situa_slot_seen'

/** One impression per session and element keeps the events table close to unique views. */
function firstTimeThisSession(key: string): boolean {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]'))
    if (seen.has(key)) return false
    seen.add(key)
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)))
    return true
  } catch {
    return true
  }
}

/**
 * Wraps a premium element: records an impression when at least half of it is visible
 * (once per session) and a click on any link inside it.
 */
export function TrackSlot({ slot, position, projectId, modelId, active = true, className, children }: TrackSlotProps) {
  const ref = useRef<HTMLDivElement>(null)
  const ids = {
    ...(projectId ? { project_id: projectId } : {}),
    ...(modelId ? { model_id: modelId } : {}),
  }
  const key = `${slot}:${position}:${projectId ?? ''}:${modelId ?? ''}`

  useEffect(() => {
    const element = ref.current
    if (!element || !active || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        if (firstTimeThisSession(key)) {
          trackEvent({ event_type: 'home_slot_impression', ...ids, filters: { slot, position } })
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(element)
    return () => observer.disconnect()
    // ids is derived from projectId/modelId, both captured by key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active, slot, position])

  return (
    <div
      ref={ref}
      className={className}
      onClickCapture={(event) => {
        if (!(event.target as HTMLElement).closest('a')) return
        trackEvent({ event_type: 'home_slot_click', ...ids, filters: { slot, position } })
      }}
    >
      {children}
    </div>
  )
}
