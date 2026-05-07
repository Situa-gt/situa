import { ArrowUpRight } from 'lucide-react'

export function HeroAccent() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block"
    >
      <div className="hero-accent-drop">
        <div className="hero-accent-bob">
          <span
            className="flex h-40 w-40 items-center justify-center rounded-full bg-brand-orange text-white shadow-[0_24px_60px_-18px_rgba(253,125,41,0.65),0_0_0_1px_rgba(255,255,255,0.18)_inset] xl:h-48 xl:w-48"
          >
            <ArrowUpRight className="h-16 w-16 xl:h-20 xl:w-20" strokeWidth={1.75} />
          </span>
        </div>
      </div>
    </div>
  )
}
