'use client'

import { cn } from '@/lib/utils/cn'
import type { FeedbackItem, Submission } from '@/types'
import {
  AlertCircle,
  Lightbulb,
  RotateCcw,
  ThumbsUp,
} from 'lucide-react'

interface RevisionBannerProps {
  submission: Submission
  isProvider: boolean
}

export function RevisionBanner({
  submission,
  isProvider,
}: RevisionBannerProps) {
  if (submission.state !== 'revision_requested') {
    return null
  }

  const review = submission.reviews?.[0]
  if (!review) {
    return null
  }

  const feedbackItems = (review.feedback_items ?? []) as FeedbackItem[]
  const issueCount = feedbackItems.filter((item) => item.type === 'issue').length
  const suggestionCount = feedbackItems.filter(
    (item) => item.type === 'suggestion'
  ).length

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border border-[hsl(var(--color-warning)/0.25)]',
        'bg-[hsl(var(--color-warning)/0.04)] p-4'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-[hsl(var(--color-warning)/0.15)]'
          )}
        >
          <RotateCcw
            size={14}
            className="text-[hsl(var(--color-warning))]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {isProvider
              ? 'Revisions requested on your submission'
              : 'Waiting for revised submission'}
          </p>
          <p className="mb-3 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
            {isProvider
              ? `v${submission.version} needs changes. Review the feedback below and submit v${submission.version + 1}.`
              : `You requested revisions on v${submission.version}. Waiting for the provider to submit the next version.`}
          </p>

          {review.feedback ? (
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-1))]">
              &quot;{review.feedback}&quot;
            </p>
          ) : null}

          {feedbackItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              {issueCount > 0 ? (
                <div className="flex items-center gap-1">
                  <AlertCircle
                    size={11}
                    className="text-[hsl(var(--color-danger))]"
                  />
                  <span className="text-[11px] text-[hsl(var(--color-danger))]">
                    {issueCount} issue{issueCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : null}
              {suggestionCount > 0 ? (
                <div className="flex items-center gap-1">
                  <Lightbulb
                    size={11}
                    className="text-[hsl(var(--color-warning))]"
                  />
                  <span className="text-[11px] text-[hsl(var(--color-warning))]">
                    {suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {isProvider && feedbackItems.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1.5">
              {feedbackItems.map((item, index) => (
                <div key={`${item.type}-${index}`} className="flex items-start gap-2">
                  {item.type === 'issue' ? (
                    <AlertCircle
                      size={11}
                      className="mt-0.5 shrink-0 text-[hsl(var(--color-danger))]"
                    />
                  ) : item.type === 'suggestion' ? (
                    <Lightbulb
                      size={11}
                      className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
                    />
                  ) : (
                    <ThumbsUp
                      size={11}
                      className="mt-0.5 shrink-0 text-[hsl(var(--color-success))]"
                    />
                  )}
                  <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    {item.content}
                    {item.file_ref ? (
                      <span className="ml-1 text-[hsl(var(--color-text-3))]">
                        - {item.file_ref}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
