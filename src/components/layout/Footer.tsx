import Image from 'next/image'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Quiero comprar' },
  { href: '/desarrolladoras', label: 'Soy Desarrolladora' },
  { href: '/ayuda', label: 'Ayuda' },
]

const ABOUT_LINKS = [
  { href: '/quienes-somos', label: 'Quiénes somos' },
  { href: '/politica-de-privacidad', label: 'Política de privacidad' },
  { href: '/terminos-y-condiciones', label: 'Términos y condiciones' },
]

const SOCIAL_LINK_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900'

type IconProps = { className?: string }

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={className}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={className}>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5ZM9 9.5h3.8v1.6h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21H17.5v-5c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6V21H9V9.5Z" />
    </svg>
  )
}

function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={className}>
      <path d="M19.5 8.6a6.7 6.7 0 0 1-3.9-1.3v7.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.6a3 3 0 1 0 2.1 2.9V2.5h2.6A4.1 4.1 0 0 0 19.5 6Z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" aria-label="Sitúa - Inicio" className="inline-flex items-center text-zinc-900">
              <Image
                src="/logo-situa.svg"
                alt="Sitúa"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
              euismod, urna at facilisis cursus, dolor lectus tristique massa,
              sed convallis nibh quam vitae sapien.
            </p>
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Desarrollado por
              </p>
              <div className="mt-2 inline-flex items-center text-zinc-700">
                <Image
                  src="/adig-logo.svg"
                  alt="ADIG"
                  width={140}
                  height={42}
                  className="h-10 w-auto"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
              Navega en Sitúa
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-zinc-600 transition hover:text-zinc-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
              Sobre Sitúa
            </h3>
            <ul className="mt-4 space-y-3">
              {ABOUT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-zinc-600 transition hover:text-zinc-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold tracking-tight text-zinc-900">
              Síguenos
            </h3>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={SOCIAL_LINK_CLASS}
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={SOCIAL_LINK_CLASS}
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className={SOCIAL_LINK_CLASS}
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className={SOCIAL_LINK_CLASS}
              >
                <TiktokIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} Sitúa.gt — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
