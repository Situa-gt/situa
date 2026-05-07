import Image from 'next/image'

export function HeroAccent() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-2 top-1/3 hidden -translate-y-1/2 lg:block xl:right-6"
    >
      <div className="hero-accent-drop">
        <div className="hero-accent-bob">
          <Image
            src="/situa_3d.png"
            alt=""
            width={530}
            height={600}
            priority
            className="h-72 w-auto drop-shadow-[0_30px_45px_rgba(20,16,80,0.35)] xl:h-96"
          />
        </div>
      </div>
    </div>
  )
}
