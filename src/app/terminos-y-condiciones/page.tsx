import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y condiciones | Sitúa',
  description: 'Términos y condiciones de uso de Sitúa.gt.',
  alternates: { canonical: '/terminos-y-condiciones' },
}

export default function Page() {
  return (
    <main className="bg-white px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 border-b border-zinc-200 pb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-brand-purple">
            Sitúa – Plataforma desarrollada por ADIG
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 lg:text-5xl">
            Términos y condiciones
          </h1>
        </div>

        {/* Body */}
        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-700">

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar el sitio web situa.gt (en adelante, "la Plataforma"), el
              usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo, deberá
              abstenerse de utilizar la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              2. Objeto de la Plataforma
            </h2>
            <p>
              Sitúa es una plataforma digital desarrollada por ADIG que conecta desarrolladores
              inmobiliarios con compradores e inversionistas, permitiendo explorar proyectos por
              ubicación, características y disponibilidad.
            </p>
            <p className="mt-3">
              Sitúa no es propietaria de los proyectos publicados, ni actúa como constructora,
              desarrolladora o entidad financiera.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              3. Uso adecuado
            </h2>
            <p className="mb-3">El usuario se compromete a:</p>
            <ul className="space-y-1.5 pl-5">
              {[
                'Proporcionar información veraz en formularios de contacto.',
                'No utilizar la Plataforma para fines ilícitos o fraudulentos.',
                'No intentar vulnerar la seguridad del sitio.',
              ].map((item) => (
                <li key={item} className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Sitúa podrá suspender el acceso a usuarios que incumplan estas condiciones.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              4. Información publicada
            </h2>
            <p>
              La información de proyectos (precios, disponibilidad, características, renders,
              planos) es proporcionada por las desarrolladoras. Sitúa no garantiza que dicha
              información esté libre de cambios o actualizaciones posteriores.
            </p>
            <p className="mt-3">
              Los precios y condiciones están sujetos a modificación sin previo aviso.
            </p>
            <p className="mt-3">
              Sitúa no se hace responsable por la veracidad, actualización o exactitud de la
              información proporcionada por las desarrolladoras, ni por acuerdos, negociaciones
              o transacciones que se realicen entre usuarios y terceros.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              5. Propiedad intelectual
            </h2>
            <p>
              Todo el contenido de la Plataforma (marca, diseño, textos, estructura, logotipos,
              bases de datos y software) es propiedad de Sitúa y/o sus aliados, y está protegido
              por las leyes aplicables.
            </p>
            <p className="mt-3">Queda prohibida su reproducción sin autorización escrita.</p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              6. Limitación de responsabilidad
            </h2>
            <p className="mb-3">
              Sitúa actúa como intermediario digital de información. No es responsable por:
            </p>
            <ul className="space-y-1.5 pl-5">
              {[
                'Negociaciones directas entre usuario y desarrolladora.',
                'Cambios en condiciones comerciales.',
                'Decisiones de inversión tomadas por el usuario.',
              ].map((item) => (
                <li key={item} className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              El usuario reconoce que cualquier decisión inmobiliaria debe realizarse bajo su
              propio análisis y criterio.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              7. Modificaciones
            </h2>
            <p>
              Sitúa podrá actualizar estos Términos y Condiciones en cualquier momento. Las
              modificaciones entrarán en vigencia desde su publicación en la Plataforma.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
