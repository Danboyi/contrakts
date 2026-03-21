import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  back?: { label: string; href: string }
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  back,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex items-start justify-between border-b border-[hsl(var(--color-border))] pb-6',
        className
      )}
    >
      <div>
        {back && (
          <Link
            href={back.href}
            className={cn(
              'mb-3 inline-flex items-center gap-1.5 text-xs text-[hsl(var(--color-text-3))]',
              'transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]'
            )}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {back.label}
          </Link>
        )}
        <h1 className="text-xl font-semibold leading-tight text-[hsl(var(--color-text-1))]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[hsl(var(--color-text-2))]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="ml-4 flex shrink-0 items-center gap-3">{actions}</div>
      )}
    </div>
  )
}
