import Image from 'next/image'

export function HomeBanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-purple">
        <Image
          src="/aerea_ciudad_gt.png"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(107,102,235,1) 0%, rgba(107,102,235,1) 20%, rgba(107,102,235,0.17) 100%)',
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
