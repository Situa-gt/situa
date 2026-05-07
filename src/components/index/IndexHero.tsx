interface Props {
  title: string
  subtitle?: string
}

export function IndexHero({ title, subtitle }: Props) {
  return (
    <header className="mx-auto w-full max-w-7xl px-6 pt-10 pb-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base text-zinc-600">{subtitle}</p>
      )}
    </header>
  )
}
