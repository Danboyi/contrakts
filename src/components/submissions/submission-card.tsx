'use client'

import { formatDistanceToNow } from 'date-fns'
import { PreviewPanel } from '@/components/preview'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { FeedbackItem, Submission } from '@/types'
import {
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  RotateCcw,
  XCircle,
} from 'lucide-react'

interface SubmissionCardProps {
  submission: Submission
  isReceiver: boolean
  isLatest: boolean
  onReview?: (submissionId: string) => void
}

const STATE_CONFIG = {
  pending_review: {
    label: 'Pending review',
    icon: Clock,
    variant: 'warning' as const,
  },
  in_review: {
    label: 'In review',
    icon: Eye,
    variant: 'accent' as const,
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    variant: 'success' as const,
  },
  revision_requested: {
    label: 'Revisions requested',
    icon: RotateCcw,
    variant: 'warning' as const,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'danger' as const,
  },
}

export function SubmissionCard({
  submission,
  isReceiver,
  isLatest,
  onReview,
}: SubmissionCardProps) {
  const config =
    STATE_CONFIG[submission.state as keyof typeof STATE_CONFIG] ??
    STATE_CONFIG.pending_review
  const StatusIcon = config.icon
  const review = submission.reviews?.[0]
  const timeAgo = formatDistanceToNow(new Date(submission.submitted_at), {
    addSuffix: true,
  })

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border transition-all duration-200',
        isLatest
          ? 'border-[hsl(var(--color-border-2))] bg-[hsl(var(--color-surface))]'
          : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.25)] opacity-80'
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--color-border))] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))] px-2 py-0.5 text-xs font-bold text-[hsl(var(--color-text-2))]">
            v{submission.version}
          </span>
          <Badge variant={config.variant} size="sm">
            <StatusIcon size={11} />
            {config.label}
          </Badge>
        </div>
        <span className="text-[10px] text-[hsl(var(--color-text-3))]">
          {timeAgo}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              'bg-[hsl(var(--color-surface-2))] text-[9px] font-bold text-[hsl(var(--color-text-3))]'
            )}
          >
            {submission.submitter?.full_name
              ?.split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() ?? 'SP'}
          </div>
          <span className="text-xs text-[hsl(var(--color-text-2))]">
            {submission.submitter?.full_name ?? 'Service Provider'}
          </span>
        </div>

        {submission.note && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-1))]">
            {submission.note}
          </p>
        )}

        <PreviewPanel submission={submission} />

        {review && (
          <div
            className={cn(
              'rounded-[var(--radius-lg)] border p-3',
              review.verdict === 'approved'
                ? 'border-[hsl(var(--color-success)/0.15)] bg-[hsl(var(--color-success)/0.04)]'
                : review.verdict === 'revision_requested'
                  ? 'border-[hsl(var(--color-warning)/0.15)] bg-[hsl(var(--color-warning)/0.04)]'
                  : 'border-[hsl(var(--color-danger)/0.15)] bg-[hsl(var(--color-danger)/0.04)]'
            )}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <MessageSquare
                size={12}
                className="text-[hsl(var(--color-text-3))]"
              />
              <span className="text-[10px] font-medium text-[hsl(var(--color-text-3))]">
                Feedback from {review.reviewer?.full_name ?? 'Service Receiver'}
              </span>
            </div>

            {review.feedback && (
              <p className="mb-2 text-sm leading-relaxed text-[hsl(var(--color-text-1))]">
                {review.feedback}
              </p>
            )}

            {review.feedback_items && review.feedback_items.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {(review.feedback_items as FeedbackItem[]).map((item, index) => (
                  <div key={`${item.type}-${index}`} className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                        item.type === 'issue'
                          ? 'bg-[hsl(var(--color-danger)/0.1)] text-[hsl(var(--color-danger))]'
                          : item.type === 'suggestion'
                            ? 'bg-[hsl(var(--color-warning)/0.1)] text-[hsl(var(--color-warning))]'
                            : 'bg-[hsl(var(--color-success)/0.1)] text-[hsl(var(--color-success))]'
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                      {item.content}
                      {item.file_ref && (
                        <span className="ml-1 text-[hsl(var(--color-text-3))]">
                          ({item.file_ref})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isReceiver &&
          isLatest &&
          ['pending_review', 'in_review'].includes(submission.state) &&
          onReview && (
            <button
              type="button"
              onClick={() => onReview(submission.id)}
              className={cn(
                'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)]',
                'bg-[hsl(var(--color-accent))] px-4 py-2.5 text-sm font-semibold text-white',
                'transition-all duration-150 hover:brightness-110 active:scale-[0.98]'
              )}
            >
              <Eye size={15} />
              Review submission
            </button>
          )}
      </div>
    </div>
  )
}
