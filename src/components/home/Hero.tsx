import Image from 'next/image'
import Link from 'next/link'
import { Building2, Calculator, HomeIcon, MapPinned, Search, Sparkles } from 'lucide-react'
import {
  getDepartmentOptions,
  getHeroProjects,
  getMunicipalityOptions,
  getZoneOptions,
} from '@/lib/queries/home'
import type { Filters } from '@/lib/filters/parse'
import { HeroFilters } from './HeroFilters'
import { HeroAccent } from './HeroAccent'

interface Props {
  initial: Filters
}

const quickLinks = [
  { label: 'Todos', href: '/', icon: Sparkles },
  { label: 'Apartamentos', href: '/apartamentos', icon: Building2 },
  { label: 'Casas', href: '/casas', icon: HomeIcon },
  { label: 'Zonas', href: '/zona-15', icon: MapPinned },
  { label: 'Calculadora', href: '/calculadora', icon: Calculator },
]

export async function Hero({ initial }: Props) {
  const [zoneOptions, departmentOptions, municipalityOptions, heroProjects] = await Promise.all([
    getZoneOptions(),
    getDepartmentOptions(),
    getMunicipalityOptions(),
    getHeroProjects(),
  ])
  const heroCandidates = heroProjects.filter((project) => project.cover_url)
  const heroProject =
    heroCandidates.length > 0
      ? heroCandidates[Math.floor(Math.random() * heroCandidates.length)]
      : null

  return (
    <section className="relative isolate z-20 border-b border-hairline bg-[#f7f7fb]">
      {heroProject?.cover_url ? (
        <Image
          src={heroProject.cover_url}
          alt=""
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 -z-30 object-cover"
          aria-hidden
        />
      ) : (
        <Image
          src="/aerea_ciudad_gt.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 -z-30 object-cover"
          aria-hidden
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'linear-gradient(110deg, rgba(107,102,235,0.78) 0%, rgba(107,102,235,0.48) 45%, rgba(253,125,41,0.18) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-b from-transparent to-white"
      />
      <HeroAccent />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div aria-hidden />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones principales">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/15 hover:text-white"
            >
              <Icon className="h-4 w-4 text-white" />
              {label}
            </Link>
          ))}
        </nav>
        <div aria-hidden />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-6 md:pb-12 md:pt-10">
        <div className="mb-8 max-w-2xl text-white">
          <Link href="/" aria-label="Sitúa - Inicio" className="mb-7 inline-flex">
            <Image
              src="/logo_situa_blanco.png"
              alt="Sitúa"
              width={320}
              height={86}
              priority
              className="h-[64px] w-auto sm:h-[78px]"
            />
          </Link>
          <h1 className="text-[clamp(2.35rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
            Vivienda Nueva en Guatemala
          </h1>
          <p className="mt-4 max-w-xl rounded-2xl border border-white/25 bg-white/12 px-5 py-4 text-lg leading-relaxed text-white/90 backdrop-blur-sm sm:text-2xl">
            Busca, compara, cotiza y compra la mejor opción en un solo lugar.
          </p>
        </div>

        <HeroFilters
          initial={initial}
          zoneOptions={zoneOptions}
          departmentOptions={departmentOptions}
          municipalityOptions={municipalityOptions}
          compact
        />
        {heroProject ? (
          <div className="mt-0 border-t border-white/55 bg-white/80 px-6 py-3 shadow-[0_22px_42px_-34px_rgba(20,16,80,0.5)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-ink sm:text-sm">
              Proyecto destacado: <span className="text-ink">{heroProject.name}</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-3 overflow-x-auto px-5 pb-6 sm:px-6 lg:hidden">
        {quickLinks.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm"
          >
            <Icon className="h-4 w-4 text-brand-purple" />
            {label}
          </Link>
        ))}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm"
        >
          <Search className="h-4 w-4 text-brand-purple" />
          Buscar
        </Link>
      </div>
    </section>
  )
}
