import { Check } from 'lucide-react'

interface Props {
  amenities: string[] | null
}

export function ProjectAmenities({ amenities }: Props) {
  const list = amenities ?? []
  if (list.length === 0) return null

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Amenidades
      </h2>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a} className="flex items-center gap-3 text-sm text-body">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            {a}
          </li>
        ))}
      </ul>
    </section>
  )
}
