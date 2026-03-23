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
        'mb-8 flex w-full max-w-full flex-col gap-4 border-b border-[hsl(var(--color-border))] pb-6 md:flex-row md:items-start md:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
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
        <h1 className="truncate text-xl font-semibold leading-tight text-[hsl(var(--color-text-1))] sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--color-text-2))]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-3 md:ml-4 md:w-auto md:flex-shrink-0 md:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
