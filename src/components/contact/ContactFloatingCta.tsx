'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { CtaButton } from '@/components/ui/cta-button'

// Offset so the form clears the sticky navbar when scrolled into view.
const SCROLL_OFFSET = 80

export function ContactFloatingCta() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const el = document.getElementById('contacto')
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function scrollToForm() {
    const el = document.getElementById('contacto')
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // Portal to <body> so the fixed position resolves against the viewport,
  // escaping the route transition wrapper whose transform would otherwise
  // become the containing block for fixed descendants.
  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-x-0 bottom-4 z-40 flex justify-center px-6 transition-all duration-300 lg:hidden',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <CtaButton onClick={scrollToForm} className="shadow-lg" aria-hidden={!show} tabIndex={show ? 0 : -1}>
        Me interesa
      </CtaButton>
    </div>,
    document.body,
  )
}
