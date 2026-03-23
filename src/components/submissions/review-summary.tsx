'use client'

import { cn } from '@/lib/utils/cn'
import type { FeedbackItem, ReviewVerdict } from '@/types'
import {
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react'

interface ReviewSummaryProps {
  verdict: ReviewVerdict | null
  submissionVersion: number
  feedback: string
  feedbackItems: FeedbackItem[]
  confirmingReject?: boolean
}

const SUMMARY_CONFIG = {
  approved: {
    icon: CheckCircle,
    title: 'Approval summary',
    description:
      'Approving this version marks the milestone approved and starts payment release.',
    tone: 'border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.06)] text-[hsl(var(--color-success))]',
  },
  revision_requested: {
    icon: RotateCcw,
    title: 'Revision summary',
    description:
      'Requesting revisions moves the milestone back to in progress and notifies the provider.',
    tone: 'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] text-[hsl(var(--color-warning))]',
  },
  rejected: {
    icon: XCircle,
    title: 'Rejection summary',
    description:
      'Rejecting this version resets the milestone to in progress. The provider can resubmit or raise a dispute.',
    tone: 'border-[hsl(var(--color-danger)/0.2)] bg-[hsl(var(--color-danger)/0.06)] text-[hsl(var(--color-danger))]',
  },
} as const

export function ReviewSummary({
  verdict,
  submissionVersion,
  feedback,
  feedbackItems,
  confirmingReject,
}: ReviewSummaryProps) {
  if (!verdict) {
    return null
  }

  const config = SUMMARY_CONFIG[verdict]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border p-3',
        config.tone
      )}
    >
      <div className="flex items-start gap-3">
        <Icon size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-semibold">{config.title}</p>
            <span className="text-[11px] text-[hsl(var(--color-text-3))]">
              v{submissionVersion}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
            {config.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[hsl(var(--color-text-3))]">
            <span>{feedback.trim() ? 'Overall feedback included' : 'No overall note'}</span>
            <span>
              {feedbackItems.length} feedback item
              {feedbackItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {verdict === 'rejected' && confirmingReject ? (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.2)] bg-[hsl(var(--color-danger)/0.08)] px-3 py-2">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-[hsl(var(--color-danger))]"
              />
              <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                Click again to confirm the rejection.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
