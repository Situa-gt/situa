import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon/ComingSoon'

export const metadata: Metadata = {
  title: 'Términos y condiciones | Sitúa',
  description: 'Términos y condiciones de uso de Sitúa.gt.',
  alternates: { canonical: '/terminos-y-condiciones' },
}

export default function Page() {
  return <ComingSoon title="Términos y condiciones" />
}
