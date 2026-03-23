'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { PreviewPanel } from '@/components/preview'
import { cn } from '@/lib/utils/cn'
import { reviewSubmission } from '@/lib/submissions/actions'
import { FeedbackForm } from './feedback-form'
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Package,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import type { FeedbackItem, ReviewVerdict, Submission } from '@/types'

interface ReviewModalProps {
  submission: Submission
  onClose: () => void
  onReviewed?: () => void
}

export function ReviewModal({
  submission,
  onClose,
  onReviewed,
}: ReviewModalProps) {
  const [reviewedVerdict, setReviewedVerdict] = useState<ReviewVerdict | null>(null)

  const confirmation = useMemo(() => {
    if (!reviewedVerdict) {
      return null
    }

    if (reviewedVerdict === 'approved') {
      return {
        icon: CheckCircle,
        title: 'Submission approved',
        description:
          'The milestone has been approved and the payout flow has been triggered.',
        tone: 'bg-[hsl(var(--color-success)/0.1)] text-[hsl(var(--color-success))]',
      }
    }

    if (reviewedVerdict === 'revision_requested') {
      return {
        icon: RotateCcw,
        title: 'Revisions requested',
        description:
          'The service provider has been notified and can submit a new version.',
        tone: 'bg-[hsl(var(--color-warning)/0.1)] text-[hsl(var(--color-warning))]',
      }
    }

    return {
      icon: XCircle,
      title: 'Submission rejected',
      description:
        'The provider has been notified. They can resubmit or raise a dispute.',
      tone: 'bg-[hsl(var(--color-danger)/0.1)] text-[hsl(var(--color-danger))]',
    }
  }, [reviewedVerdict])

  const ConfirmationIcon = confirmation?.icon

  const handleSubmitReview = useCallback(
    async (params: {
      verdict: ReviewVerdict
      feedback: string
      feedbackItems: FeedbackItem[]
    }) => {
      await reviewSubmission({
        submissionId: submission.id,
        verdict: params.verdict,
        feedback: params.feedback || undefined,
        feedbackItems: params.feedbackItems,
      })

      setReviewedVerdict(params.verdict)
    },
    [submission.id]
  )

  function handleCloseAfterReview() {
    onReviewed?.()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          'left-0 top-0 h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 gap-0 border-none',
          'rounded-none bg-[hsl(var(--color-bg))] p-0 sm:rounded-none',
          '[&>button]:hidden'
        )}
      >
        <DialogTitle className="sr-only">
          Review submission v{submission.version}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Review the latest submission, leave feedback, and approve, request
          revisions, or reject it.
        </DialogDescription>

        {confirmation ? (
          <div className="flex h-full flex-col">
            <div className="flex flex-1 items-center justify-center px-6">
              <div className="max-w-[420px] text-center">
                <div
                  className={cn(
                    'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full',
                    confirmation.tone
                  )}
                >
                  {ConfirmationIcon ? <ConfirmationIcon size={24} /> : null}
                </div>
                <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--color-text-1))]">
                  {confirmation.title}
                </h2>
                <p className="mb-6 text-sm text-[hsl(var(--color-text-2))]">
                  {confirmation.description}
                </p>
                <Button onClick={handleCloseAfterReview} className="min-h-[44px]">
                  Back to milestone
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden">
            <div
              className={cn(
                'shrink-0 border-b border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface)/0.8)] px-4 py-3 backdrop-blur-sm sm:px-6'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-md)]',
                      'text-[hsl(var(--color-text-3))] transition-colors duration-150',
                      'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
                    )}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      Review Submission v{submission.version}
                    </h1>
                    <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                      {submission.submitter?.full_name ?? 'Service Provider'} -{' '}
                      {submission.submission_type}
                    </p>
                  </div>
                </div>

                {submission.external_url ? (
                  <a
                    href={submission.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'hidden shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium sm:flex',
                      'bg-[hsl(var(--color-accent)/0.08)] text-[hsl(var(--color-accent))]',
                      'transition-colors duration-150 hover:bg-[hsl(var(--color-accent)/0.15)]'
                    )}
                  >
                    <ExternalLink size={12} />
                    Open link
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row">
              <div
                className={cn(
                  'min-w-0 flex-1 overflow-y-auto p-4 sm:p-6',
                  'lg:border-r lg:border-[hsl(var(--color-border))]'
                )}
              >
                {submission.note ? (
                  <div
                    className={cn(
                      'mb-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
                      'bg-[hsl(var(--color-surface))] p-3'
                    )}
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                      Provider&apos;s notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-1))]">
                      {submission.note}
                    </p>
                  </div>
                ) : null}

                <PreviewPanel submission={submission} />

                {!submission.external_url &&
                (!submission.deliverables || submission.deliverables.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package
                      size={32}
                      className="mb-3 text-[hsl(var(--color-text-3))]"
                    />
                    <p className="text-sm text-[hsl(var(--color-text-2))]">
                      No files or links in this submission.
                    </p>
                  </div>
                ) : null}
              </div>

              <div
                className={cn(
                  'w-full shrink-0 overflow-y-auto bg-[hsl(var(--color-surface)/0.5)] p-4 sm:p-6',
                  'lg:w-[420px]'
                )}
              >
                <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  Your Review
                </h2>
                <FeedbackForm
                  submissionVersion={submission.version}
                  onSubmit={handleSubmitReview}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
