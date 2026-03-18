import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number
  max?: number
  size?: 'xs' | 'sm' | 'md'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
  showLabel?: boolean
  label?: string
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
} as const

const variantMap = {
  default: 'bg-[hsl(var(--color-accent))]',
  success: 'bg-[hsl(var(--color-success))]',
  warning: 'bg-[hsl(var(--color-warning))]',
  danger: 'bg-[hsl(var(--color-danger))]',
} as const

export function Progress({
  value,
  max = 100,
  size = 'sm',
  variant = 'default',
  className,
  showLabel,
  label,
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-[hsl(var(--color-text-3))]">{label}</span>
          {showLabel && (
            <span className="text-xs font-medium text-[hsl(var(--color-text-2))]">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-[hsl(var(--color-border))]',
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantMap[variant]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MilestoneProgress({
  total,
  paid,
  active,
}: {
  total: number
  paid: number
  active: number
}) {
  const paidPct = total > 0 ? (paid / total) * 100 : 0
  const activePct = total > 0 ? (active / total) * 100 : 0

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-[hsl(var(--color-text-3))]">Milestones</span>
        <span className="text-xs font-medium text-[hsl(var(--color-text-2))]">
          {paid} of {total} paid
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
        <div
          className="h-full bg-[hsl(var(--color-success))] transition-all duration-500"
          style={{ width: `${paidPct}%` }}
        />
        <div
          className="h-full bg-[hsl(var(--color-warning)/0.6)] transition-all duration-500"
          style={{ width: `${activePct}%` }}
        />
      </div>
    </div>
  )
}
