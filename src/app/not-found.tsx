import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <Image
        src="/404.png"
        alt="Página no encontrada"
        width={320}
        height={320}
        className="mb-6 h-auto w-64"
        priority
      />
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-semibold">No encontramos esta página</h1>
      <p className="mt-3 text-muted-foreground">
        Es posible que el enlace haya cambiado o que el proyecto ya no esté disponible.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-brand-purple px-6 text-sm font-medium text-white transition hover:bg-brand-purple/90"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
