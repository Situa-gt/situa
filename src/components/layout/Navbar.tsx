'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const wrapperClass = isHome
    ? 'absolute inset-x-0 top-0 z-30 text-white'
    : 'sticky top-0 z-30 bg-brand-purple text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]'

  return (
    <header className={wrapperClass}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Sitúa - Inicio" className="inline-flex items-center">
          <Image
            src="/logo-situa.svg"
            alt="Sitúa"
            width={144}
            height={38}
            priority
            className="h-[38px] w-auto"
          />
        </Link>
        {!isHome && (
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-white/80 transition hover:text-white">
              Proyectos
            </Link>
            <Link href="/calculadora" className="text-sm font-medium text-white/80 transition hover:text-white">
              Calculadora
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
