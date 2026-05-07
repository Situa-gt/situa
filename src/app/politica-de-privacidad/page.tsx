import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon/ComingSoon'

export const metadata: Metadata = {
  title: 'Política de privacidad | Sitúa',
  description: 'Política de privacidad de Sitúa.gt.',
  alternates: { canonical: '/politica-de-privacidad' },
}

export default function Page() {
  return <ComingSoon title="Política de privacidad" />
}
