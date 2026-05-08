import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Quiénes somos | Sitúa',
  description:
    'Sitúa es una plataforma digital inmobiliaria desarrollada por ADIG que transforma la manera en que las personas exploran, comparan y toman decisiones sobre vivienda e inversión en Guatemala.',
  alternates: { canonical: '/quienes-somos' },
}

export default function Page() {
  return (
    <main>
      {/* ── Section 1: About ───────────────────────────────────────────── */}
      <section className="bg-brand-purple text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          {/* Left – hero image */}
          <div className="flex items-center justify-center">
            <Image
              src="/situa_3d.png"
              alt="Sitúa 3D"
              width={600}
              height={600}
              className="h-auto w-full max-w-lg object-contain drop-shadow-2xl lg:max-w-none"
              priority
            />
          </div>

          {/* Right – copy */}
          <div className="flex flex-col justify-center">
            <h1 className="mb-8 text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Quiénes somos
            </h1>

            <div className="space-y-5 text-base leading-relaxed text-white/85 lg:text-lg">
              <p>
                Sitúa es una plataforma digital inmobiliaria desarrollada por ADIG que transforma
                la manera en que las personas exploran, comparan y toman decisiones sobre vivienda
                e inversión en Guatemala.
              </p>
              <p>
                Nacimos con un propósito claro: brindar información estructurada, métricas reales
                y visibilidad efectiva en un solo lugar. Conectamos desarrolladores, compradores e
                inversionistas bajo un mismo estándar de transparencia y eficiencia, elevando la
                experiencia digital del sector inmobiliario.
              </p>
              <p>
                En Sitúa creemos que elegir dónde vivir o invertir no debería basarse únicamente
                en emoción, sino en datos, ubicación y contexto. Por eso integramos proyectos
                organizados por zona, herramientas de comparación y un entorno pensado para
                facilitar decisiones más seguras y estratégicas.
              </p>
            </div>

            <p className="mt-10 text-lg font-medium italic text-white/70 lg:text-xl">
              Sitúa. Donde las decisiones toman forma.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Cards ───────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card left */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900">
            <Image
              src="/encuentra_tu_proyecto_ideal.png"
              alt="Encuentra tu proyecto ideal"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-purple/[17%] mix-blend-multiply" />
            <div className="relative z-10 flex flex-col justify-center p-10 lg:min-h-96 lg:p-12">
              <h2 className="mb-4 text-2xl font-semibold leading-snug tracking-tight text-white lg:text-3xl">
                Encuentra tu proyecto ideal
              </h2>
              <p className="text-base leading-relaxed text-white/80 lg:text-lg">
                Descubre oportunidades de inversión inmobiliaria seleccionadas por su solidez,
                ubicación y potencial de crecimiento.
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/80 lg:text-lg">
                Tu búsqueda deja de ser una apuesta y se convierte en una decisión con respaldo.
              </p>
            </div>
          </div>

          {/* Card right */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900">
            <Image
              src="/respaldado_confianza.png"
              alt="Respaldado por una comunidad de confianza"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-purple/[17%] mix-blend-multiply" />
            <div className="relative z-10 flex flex-col justify-center p-10 lg:min-h-96 lg:p-12">
              <h2 className="mb-4 text-2xl font-semibold leading-snug tracking-tight text-white lg:text-3xl">
                Respaldado por una comunidad de confianza
              </h2>
              <p className="text-base leading-relaxed text-white/80 lg:text-lg">
                Sitúa no es solo un sitio web: es una iniciativa gremial creada para elevar los
                estándares del mercado, conectar a los actores clave del sector y ofrecer
                resultados medibles y sostenibles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
