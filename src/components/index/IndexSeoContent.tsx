import Link from 'next/link'
import type { ProjectCardData } from '@/lib/queries/home'
import { stageLabel } from '@/lib/format/stage'
import { tipoSlug } from '@/lib/types/property'
import type { PropertyType } from '@/lib/types/property'

interface Props {
  projects: ProjectCardData[]
  propertyLabel?: string
  propertyType?: PropertyType
  zoneName?: string
}

function naturalList(values: string[]) {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} y ${values.at(-1)}`
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function IndexSeoContent({
  projects,
  propertyLabel = 'Proyectos',
  propertyType,
  zoneName,
}: Props) {
  if (projects.length === 0) return null

  const stages = Array.from(
    new Set(projects.map((project) => project.stage).filter((stage) => stage !== null)),
  ).map(stageLabel)
  const prices = projects
    .map((project) => project.price_from)
    .filter((price): price is number => price !== null && price > 0)
  const payments = projects
    .map((project) => project.monthly_payment_from)
    .filter((payment): payment is number => payment !== null && payment > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : null
  const minPayment = payments.length > 0 ? Math.min(...payments) : null
  const zones = Array.from(
    new Map(
      projects
        .filter(
          (
            project,
          ): project is ProjectCardData & { zone: NonNullable<ProjectCardData['zone']> } =>
            project.zone !== null,
        )
        .map((project) => [project.zone.url_slug, project.zone]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
  const subject = zoneName
    ? `${propertyLabel.toLowerCase()} en venta en ${zoneName}`
    : `${propertyLabel.toLowerCase()} en venta en Guatemala`
  const propertyTypeLabel = propertyType === 'casa' ? 'Casas' : 'Apartamentos'

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-6 pt-8">
      <div className="border-t border-zinc-200 pt-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Compara {subject}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Sitúa reúne información de proyectos activos para que compares ubicación, modelos,
            precios desde, cuotas mensuales y etapa de entrega antes de contactar directamente a
            la desarrolladora.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Disponibilidad y etapas</h2>
            <p className="mt-3 leading-7 text-zinc-600">
              {stages.length > 0
                ? `La oferta publicada incluye proyectos en ${naturalList(stages.map((stage) => stage.toLowerCase()))}.`
                : 'Consulta cada proyecto para conocer su etapa y disponibilidad actual.'}{' '}
              La disponibilidad puede cambiar, por lo que conviene confirmarla con la
              desarrolladora antes de tomar una decisión.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Precios y cuotas para comparar</h2>
            <p className="mt-3 leading-7 text-zinc-600">
              {minPrice !== null
                ? `Hay opciones publicadas desde ${formatUsd(minPrice)}`
                : 'Cada ficha muestra los precios publicados por proyecto'}
              {minPayment !== null ? ` y cuotas desde ${formatUsd(minPayment)} al mes` : ''}.
              Revisa los modelos de cada proyecto para comparar áreas, habitaciones, amenidades y
              condiciones comerciales.
            </p>
          </div>
        </div>

        {!zoneName && propertyType && zones.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-zinc-900">
              {propertyTypeLabel} en venta por zona
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
              Explora el inventario disponible en las zonas con proyectos activos y compara las
              alternativas de cada ubicación.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {zones.map((zone) => (
                <li key={zone.url_slug}>
                  <Link
                    href={`/${zone.url_slug}/${tipoSlug(propertyType)}`}
                    className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-violet-400 hover:text-violet-700"
                  >
                    {propertyTypeLabel} en {zone.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
            <details className="group py-5">
              <summary className="cursor-pointer list-none font-semibold text-zinc-900">
                ¿Cómo comparar proyectos de vivienda nueva en Sitúa?
              </summary>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
                Compara ubicación, etapa, precio desde, cuota mensual, modelos y amenidades. Luego
                entra a la ficha del proyecto para revisar sus detalles y contactar a la
                desarrolladora.
              </p>
            </details>
            <details className="group py-5">
              <summary className="cursor-pointer list-none font-semibold text-zinc-900">
                ¿Los precios y las cuotas son definitivos?
              </summary>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
                Son valores de referencia publicados para facilitar la comparación. La
                desarrolladora debe confirmar disponibilidad, precio final, forma de pago y
                promociones vigentes.
              </p>
            </details>
            <details className="group py-5">
              <summary className="cursor-pointer list-none font-semibold text-zinc-900">
                ¿Qué significa comprar en preventa o durante la construcción?
              </summary>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
                La preventa ocurre antes de que el proyecto esté terminado. Un proyecto en
                construcción ya está en obra, mientras que entrega inmediata indica que existen
                unidades listas o próximas a entregarse. Confirma siempre las fechas con la
                desarrolladora.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  )
}
