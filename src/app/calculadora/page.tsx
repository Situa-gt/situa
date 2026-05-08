import type { Metadata } from 'next'
import { Calculadora } from '@/components/calculadora/Calculadora'

export const metadata: Metadata = {
  title: 'Calculadora de cuota mensual | Sitúa',
  description:
    'Simula tu cuota mensual hipotecaria y encuentra proyectos en preventa en Guatemala que se ajusten a tu presupuesto.',
  alternates: { canonical: '/calculadora' },
}

export default function CalculadoraPage() {
  return (
    <main>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-brand-purple text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            Herramienta gratuita
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Calculadora de
            <br />
            cuota mensual
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
            Ingresa tus datos financieros para estimar tu cuota y descubrir qué
            proyectos en Guatemala se ajustan a tu presupuesto.
          </p>
        </div>
      </section>

      {/* ── Calculator ─────────────────────────────────────────────────── */}
      <Calculadora />
    </main>
  )
}
