'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Lock,
  Timer,
} from 'lucide-react'
import { MilestoneStateBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatRelative } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Milestone } from '@/types'

const AUTO_RELEASE_MS = 72 * 60 * 60 * 1000

function Countdown({ submittedAt }: { submittedAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function calculateRemaining() {
      const deadline = new Date(submittedAt).getTime() + AUTO_RELEASE_MS
      const diff = deadline - Date.now()

      if (diff <= 0) {
        setRemaining('Auto-releasing...')
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      setRemaining(`Auto-releases in ${hours}h ${minutes}m`)
    }

    calculateRemaining()
    const timer = window.setInterval(calculateRemaining, 60000)
    return () => window.clearInterval(timer)
  }, [submittedAt])

  return (
    <div className="flex items-center gap-1.5">
      <Timer size={11} className="text-[hsl(var(--color-warning))]" />
      <span className="text-[11px] text-[hsl(var(--color-warning))]">
        {remaining}
      </span>
    </div>
  )
}

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  currency: string
  isClient: boolean
  isVendor: boolean
  contractState: string
  onApprove?: (id: string) => void
  onDispute?: (id: string) => void
  onSubmit?: (id: string) => void
}

function MilestoneCard({
  milestone,
  index,
  currency,
  isClient,
  isVendor,
  contractState,
  onApprove,
  onDispute,
  onSubmit,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false)

  const borderColor =
    {
      pending: 'border-l-[hsl(var(--color-border))]',
      in_progress: 'border-l-[hsl(var(--color-accent))]',
      submitted: 'border-l-[hsl(var(--color-warning))]',
      disputed: 'border-l-[hsl(var(--color-danger))]',
      approved: 'border-l-[hsl(var(--color-success))]',
      paid: 'border-l-[hsl(var(--color-success))]',
    }[milestone.state] ?? 'border-l-[hsl(var(--color-border))]'

  const isPending = milestone.state === 'pending'
  const isSubmitted = milestone.state === 'submitted'
  const isDisputed = milestone.state === 'disputed'
  const isPaid = milestone.state === 'paid'
  const isInProgress = milestone.state === 'in_progress'

  const showSubmitBtn =
    isVendor &&
    isInProgress &&
    ['active', 'funded'].includes(contractState)
  const showReviewBtns = isClient && isSubmitted

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] border-l-2 bg-[hsl(var(--color-surface))] transition-all duration-200',
        borderColor,
        isDisputed && 'bg-[hsl(var(--color-danger)/0.03)]',
        isPaid && 'opacity-80'
      )}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              isPaid && 'bg-[hsl(var(--color-success)/0.15)]',
              isDisputed && 'bg-[hsl(var(--color-danger)/0.1)]',
              isSubmitted && 'bg-[hsl(var(--color-warning)/0.1)]',
              isInProgress && 'bg-[hsl(var(--color-accent)/0.1)]',
              isPending && 'bg-[hsl(var(--color-surface-2))]'
            )}
          >
            {isPaid && (
              <CheckCircle size={14} className="text-[hsl(var(--color-success))]" />
            )}
            {isDisputed && (
              <AlertTriangle
                size={14}
                className="text-[hsl(var(--color-danger))]"
              />
            )}
            {isSubmitted && (
              <Clock size={14} className="text-[hsl(var(--color-warning))]" />
            )}
            {isInProgress && (
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-accent))] animate-pulse-soft" />
            )}
            {isPending && (
              <Lock size={12} className="text-[hsl(var(--color-text-3))]" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p
                className={cn(
                  'truncate text-sm font-medium leading-snug',
                  isPending
                    ? 'text-[hsl(var(--color-text-3))]'
                    : 'text-[hsl(var(--color-text-1))]'
                )}
              >
                {index + 1}. {milestone.title}
              </p>
              {milestone.deadline && !isPaid && (
                <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
                  Due {formatDate(milestone.deadline)}
                </p>
              )}
              {isPaid && milestone.paid_at && (
                <p className="mt-0.5 text-[11px] text-[hsl(var(--color-success))]">
                  Released {formatRelative(milestone.paid_at)}
                  {milestone.auto_released ? ' (auto-released)' : ''}
                </p>
              )}
              {isSubmitted && milestone.submitted_at && (
                <Countdown submittedAt={milestone.submitted_at} />
              )}
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isPaid
                    ? 'text-[hsl(var(--color-success))]'
                    : isDisputed
                      ? 'text-[hsl(var(--color-danger))]'
                      : 'text-[hsl(var(--color-text-1))]'
                )}
              >
                {formatCurrency(milestone.amount, currency)}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <MilestoneStateBadge state={milestone.state} />
            {isSubmitted && isClient && (
              <span className="text-[11px] text-[hsl(var(--color-warning))]">
                Awaiting your review
              </span>
            )}
            {isInProgress && isVendor && (
              <span className="text-[11px] text-[hsl(var(--color-accent))]">
                In progress
              </span>
            )}
            {milestone.description && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className={cn(
                  'flex items-center gap-1 text-[11px] transition-colors duration-150',
                  'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                <ChevronDown
                  size={12}
                  className={cn(
                    'transition-transform duration-200',
                    expanded && 'rotate-180'
                  )}
                />
                Details
              </button>
            )}
          </div>

          {expanded && milestone.description && (
            <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
              {milestone.description}
            </p>
          )}

          {isSubmitted &&
            milestone.deliverables &&
            milestone.deliverables.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <FileText size={11} className="text-[hsl(var(--color-text-3))]" />
                <span className="text-[11px] text-[hsl(var(--color-text-3))]">
                  {milestone.deliverables.length} file
                  {milestone.deliverables.length !== 1 ? 's' : ''} submitted
                </span>
              </div>
            )}

          {(showSubmitBtn || showReviewBtns) && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {showSubmitBtn && (
                <Button
                  size="md"
                  className="w-full sm:w-auto"
                  onClick={() => onSubmit?.(milestone.id)}
                >
                  Submit delivery
                </Button>
              )}
              {showReviewBtns && (
                <>
                  <Button
                    size="md"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => onApprove?.(milestone.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    className="w-full sm:w-auto text-[hsl(var(--color-danger))]"
                    onClick={() => onDispute?.(milestone.id)}
                  >
                    Raise dispute
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MilestoneTrackerProps {
  milestones: Milestone[]
  currency: string
  contractState: string
  isClient: boolean
  isVendor: boolean
  onApprove?: (id: string) => void
  onDispute?: (id: string) => void
  onSubmit?: (id: string) => void
}

export function MilestoneTracker({
  milestones,
  currency,
  contractState,
  isClient,
  isVendor,
  onApprove,
  onDispute,
  onSubmit,
}: MilestoneTrackerProps) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
        Milestones
      </h2>
      <div className="flex flex-col gap-3">
        {milestones.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
            currency={currency}
            isClient={isClient}
            isVendor={isVendor}
            contractState={contractState}
            onApprove={onApprove}
            onDispute={onDispute}
            onSubmit={onSubmit}
          />
        ))}
      </div>
    </div>
  )
}
