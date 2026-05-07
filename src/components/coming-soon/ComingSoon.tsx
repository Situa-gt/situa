import Link from 'next/link'

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Próximamente
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="mt-3 text-zinc-600">
        {description ?? 'Estamos trabajando en esta sección. Vuelve pronto.'}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
