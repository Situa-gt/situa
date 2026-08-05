import { FontAwesomeIcon, type FontAwesomeIconName } from '@/components/ui/font-awesome-icon'

export type ProjectAmenityItem = {
  name: string
  icon?: FontAwesomeIconName | string | null
}

interface Props {
  amenities: Array<string | ProjectAmenityItem> | null
}

function normalizeAmenity(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function iconForAmenity(amenity: string): FontAwesomeIconName {
  const normalized = normalizeAmenity(amenity)

  if (normalized.includes('nino') || normalized.includes('child') || normalized.includes('kid')) {
    return 'children'
  }
  if (normalized.includes('game') || normalized.includes('juego') || normalized.includes('netflix')) {
    return 'gamepad'
  }
  if (normalized.includes('pet') || normalized.includes('mascota') || normalized.includes('dog')) {
    return 'paw'
  }
  if (normalized.includes('gym') || normalized.includes('gimnasio') || normalized.includes('fitness')) {
    return 'dumbbell'
  }
  if (normalized.includes('jacuzzi') || normalized.includes('piscina') || normalized.includes('pool')) {
    return 'water-ladder'
  }
  if (normalized.includes('cowork') || normalized.includes('co-work') || normalized.includes('reunion')) {
    return 'people-roof'
  }
  if (normalized.includes('salon') || normalized.includes('lounge') || normalized.includes('social')) {
    return 'people-roof'
  }
  if (normalized.includes('roof') || normalized.includes('terraza') || normalized.includes('deck')) {
    return 'trees'
  }
  if (normalized.includes('yoga')) {
    return 'person-swimming'
  }
  if (normalized.includes('cancha') || normalized.includes('deport')) {
    return 'dumbbell'
  }
  if (normalized.includes('seguridad') || normalized.includes('security')) {
    return 'shield-check'
  }
  if (normalized.includes('elevador') || normalized.includes('elevator')) {
    return 'elevator'
  }
  if (normalized.includes('parqueo') || normalized.includes('parking')) {
    return 'square-parking'
  }
  if (normalized.includes('wifi')) {
    return 'wifi'
  }

  return 'check'
}

function safeIcon(value: string | null | undefined, fallbackName: string): FontAwesomeIconName {
  const knownIcons: FontAwesomeIconName[] = [
    'arrow-up-right',
    'bath',
    'bed',
    'building',
    'buildings',
    'car',
    'check',
    'chevron-left',
    'chevron-right',
    'child',
    'children',
    'dumbbell',
    'elevator',
    'floppy-disk',
    'gamepad',
    'grip-vertical',
    'helmet-safety',
    'house',
    'eye',
    'image',
    'key',
    'layer-group',
    'location-dot',
    'map-location-dot',
    'megaphone',
    'paw',
    'people-roof',
    'person-swimming',
    'plus',
    'ruler',
    'rotate-right',
    'shield-check',
    'square-parking',
    'star',
    'tag',
    'trash',
    'trees',
    'upload',
    'utensils',
    'warehouse',
    'water-ladder',
    'wifi',
    'xmark',
  ]
  return knownIcons.includes(value as FontAwesomeIconName)
    ? (value as FontAwesomeIconName)
    : iconForAmenity(fallbackName)
}

export function ProjectAmenities({ amenities }: Props) {
  const list = (amenities ?? [])
    .map((amenity) =>
      typeof amenity === 'string'
        ? { name: amenity, icon: iconForAmenity(amenity) }
        : { name: amenity.name, icon: safeIcon(amenity.icon, amenity.name) },
    )
    .filter((amenity) => amenity.name.trim())
  if (list.length === 0) return null

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Amenidades
      </h2>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((amenity) => (
          <li key={amenity.name} className="flex items-center gap-3 text-sm text-body">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <FontAwesomeIcon
                name={amenity.icon}
                className="h-3.5 w-3.5 opacity-90"
              />
            </span>
            {amenity.name}
          </li>
        ))}
      </ul>
    </section>
  )
}
