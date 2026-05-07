import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

interface Props {
  items: Crumb[]
}

export function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="breadcrumbs" className="text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-zinc-900 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-zinc-900' : ''}>{item.label}</span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
