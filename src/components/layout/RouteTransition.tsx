'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
  children: ReactNode
}

export function RouteTransition({ children }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <div key={pathname} className="route-fade">
      {children}
    </div>
  )
}
