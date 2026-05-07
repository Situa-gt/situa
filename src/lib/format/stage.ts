import type { Database } from '@/lib/database.types'

type Stage = Database['public']['Enums']['project_stage']

const LABELS: Record<Stage, string> = {
  lanzamiento: 'Lanzamiento',
  preventa: 'Preventa',
  construccion: 'En construcción',
  entrega_inmediata: 'Entrega inmediata',
}

export function stageLabel(stage: Stage): string {
  return LABELS[stage]
}
