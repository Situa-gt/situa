interface Props {
  children: React.ReactNode
}

export function HeroBackground({ children }: Props) {
  return (
    <section
      className="relative isolate flex min-h-[78vh] flex-col overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #6B66EB 0%, #6B66EB 55%, #fd7d29 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 80%, white 0%, transparent 45%)',
        }}
      />
      {children}
    </section>
  )
}
