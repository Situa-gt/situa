import type React from 'react'
import type { Database } from '@/lib/database.types'
import { formatPriceValue } from '@/lib/format/price'
import { stageLabel } from '@/lib/format/stage'

type Currency = Database['public']['Enums']['currency_code']
type ProjectStage = Database['public']['Enums']['project_stage']

interface ProjectSummaryProps {
  projectName: string
  zoneName: string
  developerName?: string | null
  stage: ProjectStage
  currency: Currency
  priceFrom: number | null
  monthlyFrom: number | null
  modelCount?: number
  amenities?: string[] | null
}

interface ModelSummaryProps {
  modelName: string
  projectName: string
  zoneName: string
  stage: ProjectStage
  currency: Currency
  priceFrom: number
  monthlyFrom: number | null
  sizeM2: number | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-ink">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export function ProjectReadableSummary({
  projectName,
  zoneName,
  developerName,
  stage,
  currency,
  priceFrom,
  monthlyFrom,
  modelCount,
  amenities,
}: ProjectSummaryProps) {
  const amenityPreview = (amenities ?? []).slice(0, 6)
  const quickQuestions = [
    {
      question: `¿Dónde se ubica ${projectName}?`,
      answer: `${projectName} se ubica en ${zoneName}, Guatemala.`,
    },
    {
      question: `¿En qué etapa está ${projectName}?`,
      answer: `${projectName} se encuentra en etapa ${stageLabel(stage).toLowerCase()}.`,
    },
    ...(priceFrom !== null
      ? [
          {
            question: `¿Cuál es el precio desde de ${projectName}?`,
            answer: `${projectName} tiene precios desde ${formatPriceValue(priceFrom, currency)}.`,
          },
        ]
      : []),
    ...(monthlyFrom !== null && monthlyFrom > 0
      ? [
          {
            question: `¿Cuál es la cuota desde de ${projectName}?`,
            answer: `${projectName} tiene cuotas desde ${formatPriceValue(monthlyFrom, currency)}/mes.`,
          },
        ]
      : []),
  ]

  return (
    <section className="border-t border-hairline pt-8" aria-labelledby="project-summary-title">
      <h2 id="project-summary-title" className="text-xl font-semibold tracking-tight text-ink">
        Resumen del proyecto
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">
        {projectName} es un proyecto inmobiliario en {zoneName}, Guatemala
        {developerName ? ` desarrollado por ${developerName}` : ''}. Actualmente se encuentra en
        etapa {stageLabel(stage).toLowerCase()}.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <SummaryRow label="Ubicación" value={zoneName} />
        <SummaryRow label="Estado" value={stageLabel(stage)} />
        <SummaryRow
          label="Precio desde"
          value={priceFrom !== null ? formatPriceValue(priceFrom, currency) : 'Consultar'}
        />
        <SummaryRow
          label="Cuota desde"
          value={monthlyFrom !== null && monthlyFrom > 0 ? `${formatPriceValue(monthlyFrom, currency)}/mes` : 'Consultar'}
        />
        {typeof modelCount === 'number' && (
          <SummaryRow label="Modelos" value={`${modelCount} disponibles`} />
        )}
        {developerName && <SummaryRow label="Desarrolladora" value={developerName} />}
      </dl>
      {amenityPreview.length > 0 && (
        <p className="mt-5 text-sm leading-relaxed text-body">
          Amenidades destacadas: {amenityPreview.join(', ')}.
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {quickQuestions.map((item) => (
          <div key={item.question} className="rounded-2xl bg-zinc-50 p-4">
            <h3 className="text-sm font-semibold text-ink">{item.question}</h3>
            <p className="mt-1 text-sm leading-relaxed text-body">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ModelReadableSummary({
  modelName,
  projectName,
  zoneName,
  stage,
  currency,
  priceFrom,
  monthlyFrom,
  sizeM2,
  bedrooms,
  bathrooms,
  parkingSpots,
}: ModelSummaryProps) {
  return (
    <section className="border-t border-hairline pt-8" aria-labelledby="model-summary-title">
      <h2 id="model-summary-title" className="text-xl font-semibold tracking-tight text-ink">
        Resumen del modelo
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">
        {modelName} es un modelo disponible en {projectName}, ubicado en {zoneName}, Guatemala.
        El proyecto se encuentra en etapa {stageLabel(stage).toLowerCase()}.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <SummaryRow label="Precio desde" value={formatPriceValue(priceFrom, currency)} />
        <SummaryRow
          label="Cuota desde"
          value={monthlyFrom !== null && monthlyFrom > 0 ? `${formatPriceValue(monthlyFrom, currency)}/mes` : 'Consultar'}
        />
        <SummaryRow label="Área" value={sizeM2 !== null ? `${sizeM2} m²` : 'Consultar'} />
        <SummaryRow label="Dormitorios" value={bedrooms ?? 'Consultar'} />
        <SummaryRow label="Baños" value={bathrooms ?? 'Consultar'} />
        <SummaryRow label="Parqueos" value={parkingSpots} />
      </dl>
    </section>
  )
}
