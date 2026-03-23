import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-2))] border border-[hsl(var(--color-border))]',
        accent: 'bg-[hsl(var(--color-accent)/0.12)] text-[hsl(var(--color-accent))]',
        success:
          'bg-[hsl(var(--color-success)/0.12)] text-[hsl(var(--color-success))]',
        warning:
          'bg-[hsl(var(--color-warning)/0.12)] text-[hsl(var(--color-warning))]',
        danger:
          'bg-[hsl(var(--color-danger)/0.12)] text-[hsl(var(--color-danger))]',
        gold: 'bg-[hsl(var(--color-gold)/0.12)] text-[hsl(var(--color-gold))]',
        outline:
          'bg-transparent border border-[hsl(var(--color-border-2))] text-[hsl(var(--color-text-2))]',
      },
      size: {
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'success' && 'bg-[hsl(var(--color-success))]',
            variant === 'warning' && 'bg-[hsl(var(--color-warning))]',
            variant === 'danger' && 'bg-[hsl(var(--color-danger))]',
            variant === 'accent' && 'bg-[hsl(var(--color-accent))]',
            variant === 'gold' && 'bg-[hsl(var(--color-gold))]',
            (!variant || variant === 'default' || variant === 'outline') &&
              'bg-[hsl(var(--color-text-3))]'
          )}
        />
      )}
      {children}
    </span>
  )
}

export function ContractStateBadge({ state }: { state: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> =
    {
      draft: { variant: 'default', label: 'Draft' },
      pending: { variant: 'warning', label: 'Pending' },
      pending_review: { variant: 'warning', label: 'Pending Review' },
      countered: { variant: 'warning', label: 'Counter-Offered' },
      accepted: { variant: 'success', label: 'Accepted' },
      signing: { variant: 'accent', label: 'Awaiting Signatures' },
      signed: { variant: 'accent', label: 'Signed' },
      funding: { variant: 'warning', label: 'Awaiting Funding' },
      funded: { variant: 'accent', label: 'Funded' },
      active: { variant: 'success', label: 'Active' },
      in_review: { variant: 'warning', label: 'In review' },
      disputed: { variant: 'danger', label: 'Disputed' },
      complete: { variant: 'success', label: 'Complete' },
      completed: { variant: 'success', label: 'Completed' },
      voided: { variant: 'default', label: 'Voided' },
      cancelled: { variant: 'default', label: 'Cancelled' },
      expired: { variant: 'default', label: 'Expired' },
    }
  const { variant, label } = map[state] ?? { variant: 'default', label: state }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function MilestoneStateBadge({ state }: { state: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> =
    {
      pending: { variant: 'default', label: 'Pending' },
      in_progress: { variant: 'accent', label: 'In progress' },
      submitted: { variant: 'warning', label: 'Submitted' },
      disputed: { variant: 'danger', label: 'Disputed' },
      approved: { variant: 'success', label: 'Approved' },
      paid: { variant: 'success', label: 'Paid' },
    }
  const { variant, label } = map[state] ?? { variant: 'default', label: state }
  return <Badge variant={variant} dot>{label}</Badge>
}

export { Badge, badgeVariants }
