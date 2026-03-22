'use client'

import { Clock, Shield } from 'lucide-react'
import { ContractStateBadge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { ContractFormData } from '@/hooks/use-contract-builder'

const INDUSTRY_LABELS: Record<string, string> = {
  creative: 'Creative & Design',
  construction: 'Construction',
  consulting: 'Consulting',
  logistics: 'Logistics',
  software: 'Software & Tech',
  events: 'Events',
  supply: 'Supply Chain',
  other: 'Services',
}

interface PreviewProps {
  data: ContractFormData
  totalAmount: number
  platformFee: number
  netToVendor: number
  userName: string
  className?: string
}

export function ContractPreview({
  data,
  totalAmount,
  platformFee,
  netToVendor,
  userName,
  className,
}: PreviewProps) {
  const currency = data.currency || 'USD'
  const toSmall = (value: number) => Math.round(value * 100)
  const hasTitle = data.title.trim().length > 0
  const visibleMilestones = data.milestones.filter(
    (milestone) => milestone.title.trim() && parseFloat(milestone.amount) > 0
  )

  return (
    <div
      className={cn(
        'sticky top-8 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-5 py-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
          Live preview
        </span>
        <ContractStateBadge state="draft" />
      </div>

      <div className="p-5">
        <p className="mb-1 font-mono text-[11px] tracking-wide text-[hsl(var(--color-text-3))]">
          CTR-{new Date().getFullYear()}-XXXXX
        </p>

        <h3
          className={cn(
            'mb-1 text-base font-semibold leading-snug',
            hasTitle
              ? 'text-[hsl(var(--color-text-1))]'
              : 'italic text-[hsl(var(--color-text-3))]'
          )}
        >
          {hasTitle ? data.title : 'Contract title'}
        </h3>

        {data.industry && (
          <span className="mb-4 inline-block rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--color-text-3))]">
            {INDUSTRY_LABELS[data.industry] ?? data.industry}
          </span>
        )}

        <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
              {data.initiator_role === 'vendor' ? 'Vendor (You)' : 'Client (You)'}
            </p>
            <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
              {userName}
            </p>
          </div>
          <div className="w-px self-stretch bg-[hsl(var(--color-border))]" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
              {data.initiator_role === 'vendor' ? 'Client' : 'Vendor'}
            </p>
            <p
              className={cn(
                'truncate text-sm',
                data.counterparty_email
                  ? 'font-medium text-[hsl(var(--color-text-1))]'
                  : 'italic text-[hsl(var(--color-text-3))]'
              )}
            >
              {data.counterparty_email || 'Not set yet'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
            Milestones
          </p>
          {visibleMilestones.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {visibleMilestones.map((milestone, index) => {
                const amount = parseFloat(milestone.amount)

                return (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface-2))] text-[10px] font-semibold text-[hsl(var(--color-text-3))]">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm text-[hsl(var(--color-text-2))]">
                        {milestone.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-[hsl(var(--color-text-1))]">
                      {formatCurrency(toSmall(amount), currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm italic text-[hsl(var(--color-text-3))]">
              No milestones yet
            </p>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              Contract value
            </span>
            <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              {formatCurrency(toSmall(totalAmount), currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              Platform fee (2%)
            </span>
            <span className="text-sm text-[hsl(var(--color-warning))]">
              -{formatCurrency(toSmall(platformFee), currency)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--color-border))] pt-2">
            <span className="text-xs font-medium text-[hsl(var(--color-text-2))]">
              Net to vendor
            </span>
            <span className="text-base font-semibold text-[hsl(var(--color-success))]">
              {formatCurrency(toSmall(netToVendor), currency)}
            </span>
          </div>
        </div>

        {(data.start_date || data.end_date) && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-[hsl(var(--color-text-3))]" />
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                {data.start_date && `Starts ${data.start_date}`}
                {data.start_date && data.end_date && ' · '}
                {data.end_date && `Ends ${data.end_date}`}
              </span>
            </div>
          </>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-success)/0.15)] bg-[hsl(var(--color-success)/0.06)] p-3">
          <Shield
            size={13}
            className="shrink-0 text-[hsl(var(--color-success))]"
          />
          <p className="text-[11px] leading-relaxed text-[hsl(var(--color-text-2))]">
            Funds held in escrow. Released per milestone approval.
          </p>
        </div>
      </div>
    </div>
  )
}
