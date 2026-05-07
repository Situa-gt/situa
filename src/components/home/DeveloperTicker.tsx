const PLACEHOLDERS = Array.from({ length: 10 })

export function DeveloperTicker() {
  return (
    <section className="overflow-hidden pb-12 pt-24">
      <div className="ticker-track flex w-max gap-12">
        {[0, 1].map((dup) => (
          <div key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center gap-12">
            {PLACEHOLDERS.map((_, i) => (
              <div
                key={`${dup}-${i}`}
                className="h-16 w-40 shrink-0 rounded-lg bg-zinc-200"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
