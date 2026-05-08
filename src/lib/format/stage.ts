import { Megaphone, Tag, HardHat, KeyRound, type LucideIcon } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['project_stage']

const LABELS: Record<Stage, string> = {
  lanzamiento: 'Lanzamiento',
  preventa: 'Preventa',
  construccion: 'En construcción',
  entrega_inmediata: 'Entrega inmediata',
}

const ICONS: Record<Stage, LucideIcon> = {
  lanzamiento:       Megaphone,
  preventa:          Tag,
  construccion:      HardHat,
  entrega_inmediata: KeyRound,
}

const TOOLTIPS: Record<Stage, string> = {
  lanzamiento:       'El proyecto acaba de anunciarse. Precios y disponibilidad son preliminares.',
  preventa:          'Unidades disponibles antes de iniciar construcción, generalmente a mejor precio.',
  construccion:      'El proyecto está en obras. Fecha estimada de entrega según el desarrollador.',
  entrega_inmediata: 'El proyecto está listo. Puedes recibir tu unidad de forma inmediata.',
}

export function stageLabel(stage: Stage): string {
  return LABELS[stage]
}

export function stageIcon(stage: Stage): LucideIcon {
  return ICONS[stage]
}

export function stageTooltip(stage: Stage): string {
  return TOOLTIPS[stage]
}
