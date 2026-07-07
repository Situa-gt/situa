import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export const FONT_AWESOME_ICON_NAMES = [
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
] as const

export type FontAwesomeIconName = (typeof FONT_AWESOME_ICON_NAMES)[number]

interface FontAwesomeIconProps {
  name: FontAwesomeIconName
  className?: string
  size?: number
  decorative?: boolean
  label?: string
}

export function FontAwesomeIcon({
  name,
  className,
  size = 16,
  decorative = true,
  label,
}: FontAwesomeIconProps) {
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? name)}
      aria-hidden={decorative ? true : undefined}
      className={cn('fa-icon inline-block shrink-0 bg-current', className)}
      style={{
        '--fa-icon-url': `url("/fontawesome/solid/${name}.svg")`,
        '--fa-icon-size': `${size}px`,
      } as CSSProperties}
    />
  )
}
