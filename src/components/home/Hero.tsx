import {
  getDepartmentOptions,
  getMunicipalityOptions,
  getZoneOptions,
} from '@/lib/queries/home'
import type { Filters } from '@/lib/filters/parse'
import { HeroFilters } from './HeroFilters'

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
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-32 sm:pt-40">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Encuentra tu próximo hogar en Guatemala
        </h1>
        <p className="mt-4 text-base text-zinc-700">
          Apartamentos y casas en preventa y construcción, directo de los desarrolladores.
        </p>
      </div>
      <HeroFilters
        initial={initial}
        zoneOptions={zoneOptions}
        departmentOptions={departmentOptions}
        municipalityOptions={municipalityOptions}
      />
    </div>
  )
}
