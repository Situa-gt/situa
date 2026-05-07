import { MapPin } from 'lucide-react'

interface Props {
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  zoneName: string
  projectName: string
}

export function ProjectLocation({
  latitude,
  longitude,
  googleMapsUrl,
  zoneName,
  projectName,
}: Props) {
  const hasMap = latitude !== null && longitude !== null
  const mapHref =
    googleMapsUrl ??
    (hasMap
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null)

  if (!mapHref) return null

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Ubicación
      </h2>

      <div className="mt-6 flex flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-hairline bg-zinc-50">
          {hasMap ? (
            <iframe
              title={`Ubicación de ${projectName}`}
              src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
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
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-hover"
        >
          <MapPin className="h-4 w-4" />
          Ver en Google Maps
          <span className="sr-only"> ({zoneName})</span>
        </a>
      </div>
    </section>
  )
}
