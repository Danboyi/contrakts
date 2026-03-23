'use client'

import { Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useSubmissions } from '@/hooks/use-submissions'
import type { Submission } from '@/types'
import { SubmissionCard } from './submission-card'

interface SubmissionTimelineProps {
  milestoneId?: string
  submissions?: Submission[]
  loading?: boolean
  isReceiver: boolean
  onReview?: (submissionId: string) => void
}

export function SubmissionTimeline({
  milestoneId,
  submissions,
  loading,
  isReceiver,
  onReview,
}: SubmissionTimelineProps) {
  const hook = useSubmissions(milestoneId ?? '')
  const items = submissions ?? hook.submissions
  const isLoading = loading ?? hook.loading

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package size={18} />}
        title="No submissions yet"
        description={
          isReceiver
            ? "The service provider hasn't submitted anything for this milestone yet."
            : 'Submit your deliverables here when this milestone is ready.'
        }
        size="sm"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
          Submission history
        </h3>
        <span className="text-[11px] text-[hsl(var(--color-text-3))]">
          {items.length} version{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.map((submission, index) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          isReceiver={isReceiver}
          isLatest={index === 0}
          onReview={onReview}
        />
      ))}
    </div>
  )
}
