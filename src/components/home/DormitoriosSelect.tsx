'use client'

const OPTIONS = [1, 2, 3, 4] as const

interface Props {
  value: number[]
  onChange: (v: number[]) => void
}

export function DormitoriosSelect({ value, onChange }: Props) {
  const toggle = (n: number) => {
    onChange(value.includes(n) ? value.filter((d) => d !== n) : [...value, n])
  }

  return (
    <div className="flex h-11 items-center gap-2">
      {OPTIONS.map((n) => {
        const active = value.includes(n)
        return (
          <button
            key={n}
            type="button"
            onClick={() => toggle(n)}
            className={`flex h-9 w-14 cursor-pointer items-center justify-center rounded-full text-sm font-medium transition ${
              active
                ? 'bg-brand-purple text-white shadow-sm'
                : 'border border-hairline bg-white text-ink hover:border-brand-purple hover:text-brand-purple'
            }`}
          >
            {n === 4 ? '4+' : n}
          </button>
        )
      })}
    </div>
  )
}
