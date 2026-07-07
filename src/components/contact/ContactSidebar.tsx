import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { ContactForm } from './ContactForm'
import { ContactNudge } from './ContactNudge'
import type { SuggestedProjectData } from '@/lib/queries/suggestions'

interface Props {
  projectId: string
  modelId?: string
  projectName?: string
  modelName?: string
  suggestedProjects?: SuggestedProjectData[]
  className?: string
}

export function ContactSidebar({
  projectId,
  modelId,
  projectName,
  modelName,
  suggestedProjects,
  className,
}: Props) {
  return (
    <aside
      id="contacto"
      aria-labelledby="contacto-heading"
      className={cn('lg:sticky lg:top-24 lg:self-start', className)}
    >
      <ContactNudge>
      <div className="animate-contact-glow rounded-3xl border border-hairline bg-white p-6 sm:p-7">
        <h2
          id="contacto-heading"
          className="text-xl font-semibold tracking-tight text-ink"
        >
          ¿Te interesa este proyecto?
        </h2>
        <p className="mt-1.5 text-sm text-muted-ink">
          {projectName
            ? `Déjanos tus datos y un asesor de ${projectName} te contactará.`
            : 'Déjanos tus datos y un asesor te contactará.'}
        </p>
        <div className="mt-5">
          <Suspense fallback={null}>
            <ContactForm
              projectId={projectId}
              modelId={modelId}
              projectName={projectName}
              modelName={modelName}
              suggestedProjects={suggestedProjects}
            />
          </Suspense>
        </div>
      </div>
      </ContactNudge>
    </aside>
  )
}
