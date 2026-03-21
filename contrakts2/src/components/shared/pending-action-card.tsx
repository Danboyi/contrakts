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
    border: 'border-l-[hsl(var(--color-warning)/0.6)]',
    dot: 'bg-[hsl(var(--color-warning))]',
    badge: 'bg-[hsl(var(--color-warning-dim))] text-[hsl(var(--color-warning))]',
    glow: 'group-hover:shadow-[inset_0_0_20px_hsl(var(--color-warning)/0.04)]',
  },
  danger: {
    border: 'border-l-[hsl(var(--color-danger)/0.6)]',
    dot: 'bg-[hsl(var(--color-danger))] animate-pulse-soft',
    badge: 'bg-[hsl(var(--color-danger-dim))] text-[hsl(var(--color-danger))]',
    glow: 'group-hover:shadow-[inset_0_0_20px_hsl(var(--color-danger)/0.04)]',
  },
  accent: {
    border: 'border-l-[hsl(var(--color-accent)/0.6)]',
    dot: 'bg-[hsl(var(--color-accent))]',
    badge: 'bg-[hsl(var(--color-accent-dim))] text-[hsl(var(--color-accent))]',
    glow: 'group-hover:shadow-[inset_0_0_20px_hsl(var(--color-accent)/0.04)]',
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
        'bg-[hsl(var(--color-surface))] transition-all duration-200',
        'hover:border-[hsl(var(--color-border-2))] hover:shadow-card',
        styles.border,
        styles.glow
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} />
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-2xs font-semibold',
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
          className="mt-0.5 shrink-0 text-[hsl(var(--color-text-3))] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[hsl(var(--color-text-2))]"
        />
      </div>
    </Link>
  )
}
