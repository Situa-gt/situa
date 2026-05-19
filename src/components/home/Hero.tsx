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
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-20 pt-32 sm:pt-40">
      <HeroAccent />
      <div className="mb-10 max-w-2xl">
        <h1 className="hero-enter text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
          Vivienda nueva en Guatemala
        </h1>
        <p
          className="hero-enter mt-5 max-w-lg text-lg leading-relaxed text-white/85"
          style={{ animationDelay: '120ms' }}
        >
          Busca, compara, cotiza y compra la mejor opción en un solo lugar.
        </p>
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
