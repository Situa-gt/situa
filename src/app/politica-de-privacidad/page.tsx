import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad | Sitúa',
  description: 'Política de privacidad de Sitúa.gt.',
  alternates: { canonical: '/politica-de-privacidad' },
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
            Política de privacidad
          </h1>
        </div>

        {/* Body */}
        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-700">

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              1. Información que recopilamos
            </h2>
            <p className="mb-3">Podemos recopilar la siguiente información:</p>
            <ul className="space-y-1.5 pl-5">
              {[
                'Nombre y apellido',
                'Número de teléfono',
                'Correo electrónico',
                'Intereses inmobiliarios (zona, presupuesto, tipo de propiedad)',
                'Datos de navegación dentro de la Plataforma',
              ].map((item) => (
                <li key={item} className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              2. Tipos de usuarios
            </h2>
            <p className="mb-3">La Plataforma podrá ser utilizada por:</p>
            <ul className="space-y-1.5 pl-5">
              <li className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                <span className="font-medium text-zinc-900">a)</span> Usuarios finales interesados en proyectos inmobiliarios
              </li>
              <li className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                <span className="font-medium text-zinc-900">b)</span> Empresas desarrolladoras que publican proyectos bajo acuerdos comerciales con ADIG
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              3. Finalidad del uso de datos
            </h2>
            <p className="mb-3">La información será utilizada para:</p>
            <ul className="space-y-1.5 pl-5">
              {[
                'Contactar al usuario respecto a proyectos de interés.',
                'Compartir datos con desarrolladoras correspondientes al proyecto consultado.',
                'Enviar información comercial relevante.',
                'Mejorar la experiencia de navegación y análisis de métricas.',
              ].map((item) => (
                <li key={item} className="relative pl-3 before:absolute before:left-0 before:text-brand-purple before:content-['–']">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              4. Compartición de información
            </h2>
            <p>
              Los datos podrán compartirse únicamente con desarrolladoras asociadas cuyos proyectos
              hayan sido consultados por el usuario.
            </p>
            <p className="mt-3">
              Sitúa no vende ni comercializa bases de datos a terceros no vinculados con la
              operación de la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              5. Seguridad de la información
            </h2>
            <p>
              Implementamos medidas técnicas y administrativas razonables para proteger la
              información personal contra accesos no autorizados, pérdida o alteración.
            </p>
            <p className="mt-3">
              Al registrarse o enviar una consulta, el usuario autoriza a Sitúa y a la
              desarrolladora correspondiente a contactarlo por medios electrónicos o telefónicos
              relacionados con su interés inmobiliario.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              6. Cookies
            </h2>
            <p>
              La Plataforma puede utilizar cookies y herramientas de seguimiento (Meta Ads, Google
              Ads y TikTok Ads) para análisis y remarketing.
            </p>
            <p className="mt-3">
              El usuario puede configurar su navegador para rechazar cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">
              7. Conservación de datos
            </h2>
            <p>
              Los datos se conservarán mientras exista relación comercial o interés activo.
            </p>
            <p className="mt-3">
              El usuario podrá solicitar en cualquier momento la actualización o eliminación de
              sus datos personales escribiendo a{' '}
              <a
                href="mailto:situa@adig.gt"
                className="font-medium text-brand-purple underline underline-offset-2 hover:text-brand-purple/80"
              >
                situa@adig.gt
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
