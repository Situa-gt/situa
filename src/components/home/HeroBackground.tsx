import Image from 'next/image'

interface Props {
  children: React.ReactNode
}

export function HeroBackground({ children }: Props) {
  return (
    <section className="relative isolate flex min-h-[70vh] flex-col overflow-hidden bg-zinc-100">
      <Image
        src="/hero-bg.svg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {children}
    </section>
  )
}
