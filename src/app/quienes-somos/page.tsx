import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon/ComingSoon'

export const metadata: Metadata = {
  title: 'Quiénes somos | Sitúa',
  description: 'Conoce a Sitúa, el marketplace de proyectos en preventa en Guatemala.',
  alternates: { canonical: '/quienes-somos' },
}

export default function Page() {
  return <ComingSoon title="Quiénes somos" />
}
