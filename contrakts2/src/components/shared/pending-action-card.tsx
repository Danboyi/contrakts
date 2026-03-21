import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PendingActionProps {
  title: string
  description: string
  href: string
  variant: 'warning' | 'danger' | 'accent'
  label: string
}

const variantMap = {
  warning: {
    border: 'border-l-[hsl(var(--color-warning)/0.5)]',
    dot: 'bg-[hsl(var(--color-warning))]',
    badge: 'bg-[hsl(var(--color-warning)/0.1)] text-[hsl(var(--color-warning))]',
  },
  danger: {
    border: 'border-l-[hsl(var(--color-danger)/0.5)]',
    dot: 'bg-[hsl(var(--color-danger))]',
    badge: 'bg-[hsl(var(--color-danger)/0.1)] text-[hsl(var(--color-danger))]',
  },
  accent: {
    border: 'border-l-[hsl(var(--color-accent)/0.5)]',
    dot: 'bg-[hsl(var(--color-accent))]',
    badge: 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]',
  },
} as const

export function PendingActionCard({
  title,
  description,
  href,
  variant,
  label,
}: PendingActionProps) {
  const styles = variantMap[variant]

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] border-l-2 p-4',
        'bg-[hsl(var(--color-surface))] transition-all duration-150',
        'hover:border-[hsl(var(--color-border-2))]',
        styles.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} />
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                styles.badge
              )}
            >
              {label}
            </span>
          </div>
          <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
            {description}
          </p>
        </div>
        <ArrowRight
          size={15}
          className={cn(
            'mt-0.5 shrink-0 text-[hsl(var(--color-text-3))] transition-all duration-150',
            'group-hover:translate-x-0.5 group-hover:text-[hsl(var(--color-text-2))]'
          )}
        />
      </div>
    </Link>
  )
}
