'use client'

import Link from 'next/link'
import { PartyAvatars } from '@/components/ui/avatar'
import { ContractStateBadge } from '@/components/ui/badge'
import { MilestoneProgress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Contract } from '@/types'

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

const STATE_BORDER_COLORS: Record<string, string> = {
  active: 'border-l-[hsl(var(--color-success)/0.6)]',
  funded: 'border-l-[hsl(var(--color-success)/0.6)]',
  in_review: 'border-l-[hsl(var(--color-warning)/0.6)]',
  pending: 'border-l-[hsl(var(--color-accent)/0.5)]',
  disputed: 'border-l-[hsl(var(--color-danger)/0.6)]',
  complete: 'border-l-[hsl(var(--color-success)/0.4)]',
  draft: 'border-l-[hsl(var(--color-text-3)/0.3)]',
  voided: 'border-l-[hsl(var(--color-text-3)/0.3)]',
}

interface ContractCardProps {
  contract: Contract & {
    initiator?: { full_name: string; avatar_url?: string | null } | null
    counterparty?: { full_name: string; avatar_url?: string | null } | null
    milestones?: Array<{ state: string; amount: number }> | null
  }
  compact?: boolean
}

export function ContractCard({ contract, compact }: ContractCardProps) {
  const milestones = contract.milestones ?? []
  const totalMilestones = milestones.length
  const paid = milestones.filter((milestone) => milestone.state === 'paid').length
  const active = milestones.filter((milestone) =>
    ['submitted', 'in_progress', 'in_review'].includes(milestone.state)
  ).length

  const borderColor = STATE_BORDER_COLORS[contract.state] ?? ''

  return (
    <Link
      href={`/contracts/${contract.id}`}
      className={cn(
        'group block rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] border-l-2 bg-[hsl(var(--color-surface))]',
        'transition-all duration-200',
        'hover:border-[hsl(var(--color-border-2))] hover:shadow-card hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.4)]',
        borderColor,
        compact ? 'p-4' : 'p-5'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-2xs tracking-wide text-[hsl(var(--color-text-3))]">
            {contract.ref_code}
          </p>
          <h3
            className={cn(
              'truncate font-semibold leading-snug text-[hsl(var(--color-text-1))]',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {contract.title}
          </h3>
        </div>
        <ContractStateBadge state={contract.state} />
      </div>

      {!compact && contract.initiator && (
        <div className="mb-4 flex items-center gap-3">
          <PartyAvatars
            initiator={{
              name: contract.initiator.full_name,
              src: contract.initiator.avatar_url,
            }}
            counterparty={
              contract.counterparty
                ? {
                    name: contract.counterparty.full_name,
                    src: contract.counterparty.avatar_url,
                  }
                : null
            }
          />
          <span className="text-xs text-[hsl(var(--color-text-3))]">
            {contract.counterparty
              ? `${contract.initiator.full_name} & ${contract.counterparty.full_name}`
              : `${contract.initiator.full_name} · Awaiting counterparty`}
          </span>
        </div>
      )}

      {totalMilestones > 0 && (
        <div className="mb-4">
          <MilestoneProgress total={totalMilestones} paid={paid} active={active} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))] px-2 py-1 text-xs font-medium text-[hsl(var(--color-text-3))] transition-colors group-hover:bg-[hsl(var(--color-surface-3))]">
            {INDUSTRY_LABELS[contract.industry] ?? contract.industry}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(contract.total_value, contract.currency)}
          </p>
          <p className="mt-0.5 text-2xs text-[hsl(var(--color-text-3))]">
            {formatRelative(contract.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
