import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type CommonProps = {
  children: React.ReactNode
  className?: string
  circleClassName?: string
  size?: 'md' | 'sm'
}

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: undefined
  }

type LinkProps = CommonProps & {
  href: string
  'aria-label'?: string
  target?: string
  rel?: string
}

type Props = ButtonProps | LinkProps

const SHELL =
  'group inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-orange font-medium text-white shadow-sm transition-colors hover:bg-brand-orange-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none'

const SIZE = {
  md: 'pl-5 pr-1.5 py-1.5 text-sm',
  sm: 'pl-4 pr-1 py-1 text-xs',
} as const

const CIRCLE = {
  md: 'h-8 w-8',
  sm: 'h-6 w-6',
} as const

const ICON = {
  md: 'h-4 w-4',
  sm: 'h-3.5 w-3.5',
} as const

function Inner({ children, size = 'md', circleClassName }: { children: React.ReactNode; size?: 'md' | 'sm'; circleClassName?: string }) {
  return (
    <>
      <span className="leading-none">{children}</span>
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-brand-purple text-white transition-transform group-hover:rotate-[-12deg]',
          CIRCLE[size],
          circleClassName,
        )}
        aria-hidden
      >
        <ArrowUpRight className={ICON[size]} strokeWidth={2.25} />
      </span>
    </>
  )
}

export function CtaButton(props: Props) {
  const { children, className, circleClassName, size = 'md' } = props
  const classes = cn(SHELL, SIZE[size], className)

  if ('href' in props && props.href !== undefined) {
    const { href, target, rel } = props
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        aria-label={props['aria-label']}
        className={classes}
      >
        <Inner size={size} circleClassName={circleClassName}>{children}</Inner>
      </Link>
    )
  }

  const { href: _href, ...rest } = props as ButtonProps
  void _href
  return (
    <button {...rest} className={classes}>
      <Inner size={size} circleClassName={circleClassName}>{children}</Inner>
    </button>
  )
}
