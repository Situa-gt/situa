import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon/ComingSoon'

export const metadata: Metadata = {
  title: 'Ayuda | Sitúa',
  description: 'Centro de ayuda de Sitúa.gt.',
  alternates: { canonical: '/ayuda' },
}

export default function Page() {
  return <ComingSoon title="Ayuda" />
}
