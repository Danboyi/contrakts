'use client'

import Link from 'next/link'
import { PartyAvatars } from '@/components/ui/avatar'
import { ContractStateBadge } from '@/components/ui/badge'
import { getContractDisplayState } from '@/lib/contracts/state'
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

interface ContractCardProps {
  contract: Contract & {
    initiator?: { full_name: string; avatar_url?: string | null } | null
    counterparty?: { full_name: string; avatar_url?: string | null } | null
    milestones?: Array<{ state: string; amount: number }> | null
  }
  compact?: boolean
  unreadMessages?: number
}

export function ContractCard({
  contract,
  compact,
  unreadMessages,
}: ContractCardProps) {
  const displayState = getContractDisplayState(contract)
  const milestones = contract.milestones ?? []
  const totalMilestones = milestones.length
  const paid = milestones.filter((milestone) => milestone.state === 'paid').length
  const active = milestones.filter((milestone) =>
    ['submitted', 'in_progress', 'in_review'].includes(milestone.state)
  ).length

  return (
    <Link
      href={`/contracts/${contract.id}`}
      className={cn(
        'block w-full overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5',
        'transition-all duration-150',
        'hover:border-[hsl(var(--color-border-2))] hover:bg-[hsl(var(--color-surface-2)/0.4)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.4)]',
        compact && 'p-4'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[11px] tracking-wide text-[hsl(var(--color-text-3))]">
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
        <div className="flex shrink-0 items-center gap-2">
          {unreadMessages !== undefined && unreadMessages > 0 && (
            <span
              className={cn(
                'inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white',
                'h-[18px] bg-[hsl(var(--color-accent))]'
              )}
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          <ContractStateBadge state={displayState} />
        </div>
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

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex flex-1 items-center gap-3">
          <span className="truncate rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))] px-2 py-1 text-xs font-medium text-[hsl(var(--color-text-3))]">
            {INDUSTRY_LABELS[contract.industry] ?? contract.industry}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(contract.total_value, contract.currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
            {formatRelative(contract.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
