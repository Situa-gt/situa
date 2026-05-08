import Image from 'next/image'
import Link from 'next/link'
import { DeveloperModal } from '@/components/layout/DeveloperModal'
import { AyudaModal } from '@/components/layout/AyudaModal'

const NAV_LINKS = [
  { href: '/calculadora', label: 'Calculadora de cuota' },
  { href: '/', label: 'Quiero comprar' },
]

const ABOUT_LINKS = [
  { href: '/quienes-somos', label: 'Quiénes somos' },
  { href: '/politica-de-privacidad', label: 'Política de privacidad' },
  { href: '/terminos-y-condiciones', label: 'Términos y condiciones' },
]

const SOCIAL_LINK_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white hover:text-brand-purple'

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
    <footer className="relative mt-auto overflow-hidden bg-brand-purple text-white">
      <Image
        src="/footer_bg.png"
        alt=""
        aria-hidden
        fill
        className="object-cover object-right-top opacity-60 pointer-events-none select-none"
        sizes="100vw"
      />
      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" aria-label="Sitúa - Inicio" className="inline-flex items-center">
              <Image
                src="/logo-situa.svg"
                alt="Sitúa"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              es el nuevo estándar para comercializar proyectos inmobiliarios.
              Una plataforma validada y respaldada por ADIG, creada para ofrecer
              certeza, orden y visibilidad real en el sector.
            </p>
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                Desarrollado por
              </p>
              <a
                href="https://www.adig.gt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ADIG (abre en nueva pestaña)"
                className="mt-2 inline-flex items-center transition-opacity hover:opacity-80"
              >
                <Image
                  src="/adig-logo.png"
                  alt="ADIG"
                  width={140}
                  height={42}
                  className="h-7 w-auto"
                />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Navega en Sitúa
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/80 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <DeveloperModal />
              </li>
              <li>
                <AyudaModal />
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Sobre Sitúa
            </h3>
            <ul className="mt-4 space-y-3">
              {ABOUT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/80 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold tracking-tight text-white">
              Síguenos
            </h3>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61578996510469"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={SOCIAL_LINK_CLASS}
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/situagt_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={SOCIAL_LINK_CLASS}
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/situagt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className={SOCIAL_LINK_CLASS}
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@situagt"
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

        <p className="mt-12 border-t border-white/15 pt-6 text-xs text-white/70">
          © {new Date().getFullYear()} Sitúa.gt — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
