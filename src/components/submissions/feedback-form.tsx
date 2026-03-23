'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import { FeedbackItemRow } from './feedback-item-row'
import { ReviewSummary } from './review-summary'
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import type {
  FeedbackItem,
  FeedbackItemType,
  ReviewVerdict,
} from '@/types'

interface DraftItem {
  type: FeedbackItemType
  content: string
  fileRef: string
}

interface FeedbackFormProps {
  submissionVersion: number
  onSubmit: (params: {
    verdict: ReviewVerdict
    feedback: string
    feedbackItems: FeedbackItem[]
  }) => Promise<void>
  disabled?: boolean
}

export function FeedbackForm({
  submissionVersion,
  onSubmit,
  disabled,
}: FeedbackFormProps) {
  const [verdict, setVerdict] = useState<ReviewVerdict | null>(null)
  const [overallFeedback, setOverallFeedback] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingReject, setConfirmingReject] = useState(false)

  const feedbackItems = useMemo(
    () =>
      items
        .filter((item) => item.content.trim().length > 0)
        .map((item) => ({
          type: item.type,
          content: item.content.trim(),
          file_ref: item.fileRef.trim() || undefined,
        })),
    [items]
  )

  const canSubmit =
    verdict !== null &&
    !submitting &&
    !disabled &&
    (verdict === 'approved' || overallFeedback.trim().length > 0)

  const addItem = useCallback(() => {
    setItems((current) => [
      ...current,
      { type: 'issue', content: '', fileRef: '' },
    ])
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }, [])

  const updateItem = useCallback(
    (index: number, field: keyof DraftItem, value: string) => {
      setItems((current) =>
        current.map((item, currentIndex) =>
          currentIndex === index ? { ...item, [field]: value } : item
        )
      )
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !verdict) {
      return
    }

    if (verdict === 'rejected' && !confirmingReject) {
      setConfirmingReject(true)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        verdict,
        feedback: overallFeedback.trim(),
        feedbackItems,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit this review.'
      )
      setConfirmingReject(false)
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, confirmingReject, feedbackItems, onSubmit, overallFeedback, verdict])

  const verdictButtons = [
    {
      value: 'approved' as const,
      label: 'Approve',
      description: 'Work meets requirements',
      icon: CheckCircle,
      activeClass: 'border-[hsl(var(--color-success))] bg-[hsl(var(--color-success)/0.06)]',
      iconClass: 'text-[hsl(var(--color-success))]',
    },
    {
      value: 'revision_requested' as const,
      label: 'Request Revisions',
      description: 'Needs changes before approval',
      icon: RotateCcw,
      activeClass: 'border-[hsl(var(--color-warning))] bg-[hsl(var(--color-warning)/0.06)]',
      iconClass: 'text-[hsl(var(--color-warning))]',
    },
    {
      value: 'rejected' as const,
      label: 'Reject',
      description: 'Does not meet requirements',
      icon: XCircle,
      activeClass: 'border-[hsl(var(--color-danger))] bg-[hsl(var(--color-danger)/0.06)]',
      iconClass: 'text-[hsl(var(--color-danger))]',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-3 block text-xs font-medium text-[hsl(var(--color-text-2))]">
          Your verdict on v{submissionVersion}
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {verdictButtons.map((option) => {
            const Icon = option.icon
            const isActive = verdict === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setVerdict(option.value)
                  setConfirmingReject(false)
                  setError(null)
                }}
                className={cn(
                  'flex min-h-[56px] items-center gap-2.5 rounded-[var(--radius-lg)] border-2 p-3.5 transition-all duration-150',
                  isActive
                    ? option.activeClass
                    : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] hover:border-[hsl(var(--color-border-2))]'
                )}
              >
                <Icon
                  size={18}
                  className={isActive ? option.iconClass : 'text-[hsl(var(--color-text-3))]'}
                />
                <div className="text-left">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isActive ? option.iconClass : 'text-[hsl(var(--color-text-1))]'
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--color-text-3))]">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {verdict ? (
        <Textarea
          label={
            verdict === 'approved'
              ? 'Comments (optional)'
              : 'Feedback for the service provider'
          }
          value={overallFeedback}
          onChange={(event) => setOverallFeedback(event.target.value)}
          placeholder={
            verdict === 'approved'
              ? 'Great work! Any final notes...'
              : verdict === 'revision_requested'
                ? 'Explain what needs to change and why...'
                : 'Explain why this submission is being rejected...'
          }
          rows={3}
          hint={
            verdict !== 'approved'
              ? 'Feedback is required for revisions or rejection.'
              : undefined
          }
        />
      ) : null}

      {verdict && verdict !== 'approved' ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-xs font-medium text-[hsl(var(--color-text-2))]">
              Detailed feedback items
            </label>
            <button
              type="button"
              onClick={addItem}
              className={cn(
                'flex min-h-[32px] items-center gap-1 rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-medium',
                'bg-[hsl(var(--color-accent)/0.08)] text-[hsl(var(--color-accent))]',
                'transition-colors duration-150 hover:bg-[hsl(var(--color-accent)/0.15)]'
              )}
            >
              <Plus size={12} />
              Add item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="py-3 text-center text-xs text-[hsl(var(--color-text-3))]">
              Add specific issues, suggestions, or praise to guide the next version.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item, index) => (
                <FeedbackItemRow
                  key={`${item.type}-${index}`}
                  index={index}
                  type={item.type}
                  content={item.content}
                  fileRef={item.fileRef}
                  onChangeType={(type) => updateItem(index, 'type', type)}
                  onChangeContent={(content) =>
                    updateItem(index, 'content', content)
                  }
                  onChangeFileRef={(fileRef) =>
                    updateItem(index, 'fileRef', fileRef)
                  }
                  onRemove={() => removeItem(index)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <ReviewSummary
        verdict={verdict}
        submissionVersion={submissionVersion}
        feedback={overallFeedback}
        feedbackItems={feedbackItems}
        confirmingReject={confirmingReject}
      />

      {confirmingReject ? (
        <div
          className={cn(
            'flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-danger)/0.2)]',
            'bg-[hsl(var(--color-danger)/0.06)] p-3'
          )}
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-[hsl(var(--color-danger))]"
          />
          <div>
            <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
              Confirm rejection
            </p>
            <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
              Rejecting means the provider must start over or may raise a dispute.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-[hsl(var(--color-danger))]">{error}</p>
      ) : null}

      {verdict ? (
        <Button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          variant={verdict === 'rejected' ? 'destructive' : 'primary'}
          className={cn(
            'min-h-[48px] w-full',
            verdict === 'approved' &&
              'bg-[hsl(var(--color-success))] hover:brightness-110',
            verdict === 'revision_requested' &&
              'bg-[hsl(var(--color-warning))] hover:brightness-110'
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Submitting review...
            </>
          ) : verdict === 'approved' ? (
            <>
              <CheckCircle size={16} className="mr-2" />
              Approve Submission
            </>
          ) : verdict === 'revision_requested' ? (
            <>
              <RotateCcw size={16} className="mr-2" />
              Request Revisions
            </>
          ) : confirmingReject ? (
            <>
              <XCircle size={16} className="mr-2" />
              Confirm Rejection
            </>
          ) : (
            <>
              <XCircle size={16} className="mr-2" />
              Reject Submission
            </>
          )}
        </Button>
      ) : null}
    </div>
  )
}
