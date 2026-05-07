import { Suspense } from 'react'
import { ContactForm } from './ContactForm'

interface ContactSectionProps {
  projectId: string
  modelId?: string
  projectName?: string
}

export function ContactSection({ projectId, modelId, projectName }: ContactSectionProps) {
  return (
    <section
      id="contacto"
      className="mx-auto w-full max-w-3xl px-6 py-12"
      aria-labelledby="contacto-heading"
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 id="contacto-heading" className="text-2xl font-semibold tracking-tight text-zinc-900">
          ¿Te interesa este proyecto?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {projectName
            ? `Déjanos tus datos y un asesor de ${projectName} te contactará pronto.`
            : 'Déjanos tus datos y un asesor te contactará pronto.'}
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <ContactForm projectId={projectId} modelId={modelId} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
