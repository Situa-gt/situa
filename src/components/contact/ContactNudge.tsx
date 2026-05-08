'use client'

import { useEffect, useRef } from 'react'

export function ContactNudge({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = ref.current
      if (!el) return
      el.classList.add('animate-contact-nudge')
      el.addEventListener('animationend', () => el.classList.remove('animate-contact-nudge'), { once: true })
    }, 5_000)

    return () => clearTimeout(timer)
  }, [])

  return <div ref={ref}>{children}</div>
}
