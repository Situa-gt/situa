import Image from 'next/image'
import Link from 'next/link'
import {
  getDepartmentOptions,
  getMunicipalityOptions,
  getZoneOptions,
} from '@/lib/queries/home'
import type { Filters } from '@/lib/filters/parse'
import { HeroFilters } from './HeroFilters'
import { HeroAccent } from './HeroAccent'

interface Props {
  initial: Filters
}

export async function Hero({ initial }: Props) {
  const [zoneOptions, departmentOptions, municipalityOptions] = await Promise.all([
    getZoneOptions(),
    getDepartmentOptions(),
    getMunicipalityOptions(),
  ])

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-36 pt-16 sm:pt-20">
      <HeroAccent />
      <div className="mb-10 max-w-2xl">
        <Link href="/" aria-label="Sitúa - Inicio" className="hero-enter mb-6 inline-block">
          <Image
            src="/logo_situa_blanco.png"
            alt="Sitúa"
            width={187}
            height={49}
            priority
            className="h-[49px] w-auto"
          />
        </Link>
        <h1 className="hero-enter text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
          Vivienda Nueva en Guatemala
        </h1>
        <div
          className="hero-enter mt-5 inline-block rounded-xl border border-white/40 bg-white/10 px-4 py-3 backdrop-blur-sm"
          style={{ animationDelay: '120ms' }}
        >
          <p className="max-w-lg text-2xl leading-relaxed text-white/90">
            Busca, compara, cotiza y compra<br className="hidden md:block" />la mejor opción en un solo lugar.
          </p>
        </div>
      </div>
      <div className="hero-enter" style={{ animationDelay: '240ms' }}>
        <HeroFilters
          initial={initial}
          zoneOptions={zoneOptions}
          departmentOptions={departmentOptions}
          municipalityOptions={municipalityOptions}
        />
      </div>
    </div>
  )
}
