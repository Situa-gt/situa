'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const wrapperClass = isHome
    ? 'absolute inset-x-0 top-0 z-30'
    : 'sticky top-0 z-30 border-b border-zinc-200 bg-white'

  return (
    <header className={wrapperClass}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-zinc-900">
        <Link href="/" aria-label="Sitúa - Inicio" className="inline-flex items-center">
          <Image
            src="/logo-situa.svg"
            alt="Sitúa"
            width={120}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div />
      </nav>
    </header>
  )
}
