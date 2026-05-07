import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon/ComingSoon'

export const metadata: Metadata = {
  title: 'Soy Desarrolladora | Sitúa',
  description: 'Publica tus proyectos en preventa y conecta con compradores en Guatemala.',
  alternates: { canonical: '/desarrolladoras' },
}

export default function Page() {
  return <ComingSoon title="Soy Desarrolladora" />
}
