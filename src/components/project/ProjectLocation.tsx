import { MapPin } from 'lucide-react'

interface Props {
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  addressText?: string | null
  zoneName: string
  projectName: string
}

export function ProjectLocation({
  latitude,
  longitude,
  googleMapsUrl,
  addressText,
  zoneName,
  projectName,
}: Props) {
  const hasMap = latitude !== null && longitude !== null
  const mapHref =
    googleMapsUrl ??
    (hasMap
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null)

  if (!mapHref && !addressText) return null

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Ubicación
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        {addressText ? (
          <p className="flex items-start gap-2 rounded-2xl border border-hairline bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-muted-ink">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
            <span>{addressText}</span>
          </p>
        ) : null}
        {mapHref ? (
          <>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-hairline bg-zinc-50">
              {hasMap ? (
                <iframe
                  title={`Ubicación de ${projectName}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.0015},${latitude - 0.0015},${longitude + 0.0015},${latitude + 0.0015}&layer=mapnik&marker=${latitude},${longitude}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-ink">
                  <MapPin className="h-8 w-8" />
                </div>
              )}
            </div>
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-hover"
            >
              <MapPin className="h-4 w-4" />
              Ver en Google Maps
              <span className="sr-only"> ({zoneName})</span>
            </a>
          </>
        ) : null}
      </div>
    </section>
  )
}
