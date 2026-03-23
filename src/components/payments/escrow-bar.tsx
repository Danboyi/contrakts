'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Milestone } from '@/types'

interface EscrowBarProps {
  milestones: Milestone[]
  currency: string
  state: string
}

export function EscrowBar({ milestones, currency, state }: EscrowBarProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 100)
    return () => window.clearTimeout(timer)
  }, [])

  const total = milestones.reduce((sum, milestone) => sum + milestone.amount, 0)
  const released = milestones
    .filter((milestone) => milestone.state === 'paid')
    .reduce((sum, milestone) => sum + milestone.amount, 0)
  const inReview = milestones
    .filter((milestone) =>
      ['submitted', 'in_review', 'disputed'].includes(milestone.state)
    )
    .reduce((sum, milestone) => sum + milestone.amount, 0)
  const remaining = Math.max(total - released - inReview, 0)

  const pctReleased = total > 0 ? (released / total) * 100 : 0
  const pctReview = total > 0 ? (inReview / total) * 100 : 0

  if (!['funded', 'active', 'in_review', 'disputed', 'complete'].includes(state)) {
    return null
  }

  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[hsl(var(--color-success))]" />
          <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Escrow
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(total, currency)}
          </p>
          <p className="text-xs text-[hsl(var(--color-text-3))]">Total held</p>
        </div>
      </div>

      <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
        <div
          className="h-full bg-[hsl(var(--color-success))] transition-all duration-700 ease-out"
          style={{ width: animated ? `${pctReleased}%` : '0%' }}
        />
        <div
          className={cn(
            'h-full bg-[hsl(var(--color-warning))]',
            'transition-all duration-700 ease-out'
          )}
          style={{ width: animated ? `${pctReview}%` : '0%' }}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-success))]" />
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              Released
            </span>
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(released, currency)}
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-warning))]" />
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              In review
            </span>
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(inReview, currency)}
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-border-2))]" />
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              Remaining
            </span>
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {formatCurrency(remaining, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default EscrowBar
