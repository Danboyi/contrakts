'use client'

import type { ElementType } from 'react'
import { ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDateTime } from '@/lib/utils/format-date'
import type { Payment } from '@/types'

const TYPE_CONFIG: Record<
  string,
  {
    label: string
    icon: ElementType
    color: string
    bg: string
  }
> = {
  escrow_deposit: {
    label: 'Escrow funded',
    icon: ArrowDownLeft,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
  },
  milestone_release: {
    label: 'Milestone released',
    icon: ArrowUpRight,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
  },
  platform_fee: {
    label: 'Platform fee',
    icon: DollarSign,
    color: 'text-[hsl(var(--color-text-3))]',
    bg: 'bg-[hsl(var(--color-surface-2))]',
  },
  refund: {
    label: 'Refund',
    icon: ArrowDownLeft,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
  },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-[hsl(var(--color-warning))]' },
  success: { label: 'Success', color: 'text-[hsl(var(--color-success))]' },
  failed: { label: 'Failed', color: 'text-[hsl(var(--color-danger))]' },
}

interface PaymentHistoryProps {
  payments: Payment[]
  currency: string
}

export function PaymentHistory({ payments, currency }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[hsl(var(--color-text-3))]">
        No payment activity yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {payments.map((payment, index) => {
        const config = TYPE_CONFIG[payment.payment_type] ?? {
          label: payment.payment_type,
          icon: DollarSign,
          color: 'text-[hsl(var(--color-text-2))]',
          bg: 'bg-[hsl(var(--color-surface-2))]',
        }
        const status = STATUS_MAP[payment.provider_status]
        const Icon = config.icon

        return (
          <div
            key={payment.id}
            className={cn(
              'flex items-center gap-4 py-4',
              index < payments.length - 1 && 'border-b border-[hsl(var(--color-border))]'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                config.bg
              )}
            >
              <Icon size={16} className={config.color} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                {config.label}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs capitalize text-[hsl(var(--color-text-3))]">
                  {payment.provider.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-[hsl(var(--color-border-2))]">·</span>
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  {formatDateTime(payment.created_at)}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className={cn('text-sm font-semibold', config.color)}>
                {formatCurrency(payment.net_amount, currency)}
              </p>
              <p className={cn('mt-0.5 text-xs', status?.color)}>
                {status?.label ?? payment.provider_status}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
