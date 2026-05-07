import Image from 'next/image'

// TODO: swap for a real Guatemala City asset hosted in Supabase Storage when available.
const BG_IMAGE =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1920&q=80'

export function HomeBanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-purple">
        <Image
          src={BG_IMAGE}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(107,102,235,0.85) 0%, rgba(107,102,235,0.5) 35%, rgba(107,102,235,0) 80%)',
          }}
        />
        <div className="relative max-w-2xl px-8 py-20 text-white sm:px-14 sm:py-28">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Tu nuevo hogar,
            <br />
            más cerca que nunca
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Sitúa reúne a más de 50 desarrolladores en una misma plataforma,
            unificando esfuerzos de promoción y ofreciendo una visibilidad sin
            precedentes. Cada clic es parte de una red que impulsa el desarrollo
            inmobiliario del país.
          </p>
        </div>
      </div>
    </section>
  )
}
