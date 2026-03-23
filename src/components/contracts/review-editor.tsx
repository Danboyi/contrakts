'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  History,
  MessageSquare,
  Send,
  X,
} from 'lucide-react'
import {
  acceptContract,
  rejectContract,
  submitReview,
} from '@/lib/contracts/negotiation-actions'
import {
  NEGOTIATION_STATUS_COLORS,
  ROLE_LABELS,
  STATUS_LABELS,
  type ContractReview,
  type MilestoneSnapshot,
  type PartyRole,
} from '@/lib/types/negotiation'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, fromSmallestUnit } from '@/lib/utils/format-currency'
import type { Contract, Milestone } from '@/types'

type ReviewRecord = ContractReview & {
  reviewer?: { full_name: string | null; email: string | null } | null
}

type EditableMilestone = {
  id: string | null
  title: string
  description: string
  amount: number
  due_date: string
  order: number
}

interface ReviewEditorProps {
  contract: Contract
  milestones: Milestone[]
  reviews: ReviewRecord[]
  currentUserId: string
  userRole: PartyRole
  otherParty: { id: string; full_name: string | null; email: string | null } | null
  canEdit: boolean
}

function normalizeSnapshotTerms(
  snapshot: Record<string, unknown> | null | undefined,
  contract: Contract
) {
  const source = snapshot ?? {}
  const rawTotal =
    typeof source.total_value === 'number'
      ? source.total_value
      : contract.total_value

  return {
    title: typeof source.title === 'string' ? source.title : contract.title,
    description:
      typeof source.description === 'string'
        ? source.description
        : (contract.description ?? ''),
    terms: typeof source.terms === 'string' ? source.terms : (contract.terms ?? ''),
    total_value:
      rawTotal > 1000 ? fromSmallestUnit(rawTotal) : Number(rawTotal) || 0,
    start_date:
      typeof source.start_date === 'string'
        ? source.start_date
        : (contract.start_date ?? ''),
    end_date:
      typeof source.end_date === 'string'
        ? source.end_date
        : (contract.end_date ?? ''),
  }
}

function normalizeSnapshotMilestones(
  snapshot: MilestoneSnapshot[] | null | undefined,
  fallback: Milestone[]
) {
  if (!snapshot || snapshot.length === 0) {
    return fallback.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? '',
      amount: fromSmallestUnit(milestone.amount),
      due_date: milestone.deadline ?? '',
      order: milestone.order_index,
    }))
  }

  return snapshot.map((milestone, index) => ({
    id: milestone.id ?? null,
    title: milestone.title,
    description: milestone.description ?? '',
    amount:
      milestone.amount > 1000
        ? fromSmallestUnit(milestone.amount)
        : Number(milestone.amount) || 0,
    due_date: milestone.due_date ?? '',
    order: milestone.order ?? index,
  }))
}

function formatMajorAmount(amount: number, currency: string) {
  return formatCurrency(Math.round(amount * 100), currency)
}

export function ReviewEditor({
  contract,
  milestones,
  reviews,
  currentUserId,
  userRole,
  otherParty,
  canEdit,
}: ReviewEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showHistory, setShowHistory] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  const currentTerms = useMemo(
    () => ({
      title: contract.title,
      description: contract.description ?? '',
      terms: contract.terms ?? '',
      total_value: fromSmallestUnit(contract.total_value),
      start_date: contract.start_date ?? '',
      end_date: contract.end_date ?? '',
    }),
    [contract]
  )

  const currentMilestones = useMemo(
    () =>
      milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description ?? '',
        amount: fromSmallestUnit(milestone.amount),
        due_date: milestone.deadline ?? '',
        order: milestone.order_index,
      })),
    [milestones]
  )

  const comparisonReview = useMemo(() => {
    if (contract.review_round <= 0) {
      return null
    }

    return (
      [...reviews]
        .filter((review) => review.round < contract.review_round)
        .sort((a, b) => a.round - b.round)
        .at(-1) ?? null
    )
  }, [contract.review_round, reviews])

  const comparisonTerms = useMemo(
    () => normalizeSnapshotTerms(comparisonReview?.terms_snapshot, contract),
    [comparisonReview, contract]
  )
  const comparisonMilestones = useMemo(
    () =>
      normalizeSnapshotMilestones(
        comparisonReview?.milestones_snapshot,
        milestones
      ),
    [comparisonReview, milestones]
  )

  const [editedTerms, setEditedTerms] = useState(currentTerms)
  const [editedMilestones, setEditedMilestones] =
    useState<EditableMilestone[]>(currentMilestones)

  const hasLocalChanges = useMemo(() => {
    if (editedTerms.title !== currentTerms.title) return true
    if (editedTerms.description !== currentTerms.description) return true
    if (editedTerms.terms !== currentTerms.terms) return true
    if (editedTerms.total_value !== currentTerms.total_value) return true
    if (editedTerms.start_date !== currentTerms.start_date) return true
    if (editedTerms.end_date !== currentTerms.end_date) return true
    if (editedMilestones.length !== currentMilestones.length) return true

    return editedMilestones.some((milestone, index) => {
      const current = currentMilestones[index]

      return (
        !current ||
        milestone.title !== current.title ||
        milestone.description !== current.description ||
        milestone.amount !== current.amount ||
        milestone.due_date !== current.due_date
      )
    })
  }, [currentMilestones, currentTerms, editedMilestones, editedTerms])

  const otherPartyName =
    otherParty?.full_name || otherParty?.email || 'the other party'
  const milestonesTotal = editedMilestones.reduce(
    (sum, milestone) =>
      sum + (Number.isFinite(milestone.amount) ? milestone.amount : 0),
    0
  )

  function updateMilestone(
    index: number,
    field: keyof EditableMilestone,
    value: string | number
  ) {
    setEditedMilestones((previous) => {
      const next = [...previous]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addMilestone() {
    setEditedMilestones((previous) => [
      ...previous,
      {
        id: null,
        title: '',
        description: '',
        amount: 0,
        due_date: '',
        order: previous.length,
      },
    ])
  }

  function removeMilestone(index: number) {
    setEditedMilestones((previous) =>
      previous
        .filter((_, currentIndex) => currentIndex !== index)
        .map((milestone, currentIndex) => ({
          ...milestone,
          order: currentIndex,
        }))
    )
  }

  function syncTotalWithMilestones() {
    setEditedTerms((previous) => ({
      ...previous,
      total_value: milestonesTotal,
    }))
  }

  function getChangesSummary() {
    const changes: string[] = []

    if (editedTerms.title !== currentTerms.title) {
      changes.push(`Changed title from "${currentTerms.title}" to "${editedTerms.title}"`)
    }

    if (editedTerms.description !== currentTerms.description) {
      changes.push('Updated project description')
    }

    if (editedTerms.terms !== currentTerms.terms) {
      changes.push('Updated contract terms')
    }

    if (editedTerms.total_value !== currentTerms.total_value) {
      changes.push(
        `Changed total value from ${formatMajorAmount(currentTerms.total_value, contract.currency)} to ${formatMajorAmount(editedTerms.total_value, contract.currency)}`
      )
    }

    if (editedTerms.start_date !== currentTerms.start_date) {
      changes.push(`Changed start date to ${editedTerms.start_date || 'not set'}`)
    }

    if (editedTerms.end_date !== currentTerms.end_date) {
      changes.push(`Changed end date to ${editedTerms.end_date || 'not set'}`)
    }

    editedMilestones.forEach((milestone, index) => {
      const current = currentMilestones[index]

      if (!current) {
        changes.push(`Added new milestone: "${milestone.title || `Milestone ${index + 1}`}"`)
        return
      }

      if (milestone.title !== current.title) {
        changes.push(`Renamed milestone "${current.title}" to "${milestone.title}"`)
      }

      if (milestone.description !== current.description) {
        changes.push(`Updated description for "${milestone.title || current.title}"`)
      }

      if (milestone.amount !== current.amount) {
        changes.push(
          `Changed "${milestone.title || current.title}" amount from ${formatMajorAmount(current.amount, contract.currency)} to ${formatMajorAmount(milestone.amount, contract.currency)}`
        )
      }

      if (milestone.due_date !== current.due_date) {
        changes.push(`Changed "${milestone.title || current.title}" due date`)
      }
    })

    if (editedMilestones.length < currentMilestones.length) {
      const removedCount = currentMilestones.length - editedMilestones.length
      changes.push(`Removed ${removedCount} milestone${removedCount === 1 ? '' : 's'}`)
    }

    return changes
  }

  function incomingTermChanged<K extends keyof typeof currentTerms>(field: K) {
    return currentTerms[field] !== comparisonTerms[field]
  }

  function localTermChanged<K extends keyof typeof currentTerms>(field: K) {
    return editedTerms[field] !== currentTerms[field]
  }

  function baselineTermValue<K extends keyof typeof currentTerms>(field: K) {
    return incomingTermChanged(field) ? comparisonTerms[field] : currentTerms[field]
  }

  function incomingMilestoneChanged(index: number, field: keyof EditableMilestone) {
    const current = currentMilestones[index]
    const baseline = comparisonMilestones[index]

    if (!current || !baseline) {
      return false
    }

    return current[field] !== baseline[field]
  }

  function localMilestoneChanged(index: number, field: keyof EditableMilestone) {
    const current = currentMilestones[index]
    const edited = editedMilestones[index]

    if (!current || !edited) {
      return false
    }

    return edited[field] !== current[field]
  }

  function baselineMilestoneValue(index: number, field: keyof EditableMilestone) {
    const current = currentMilestones[index]
    const baseline = comparisonMilestones[index]

    if (incomingMilestoneChanged(index, field) && baseline) {
      return baseline[field]
    }

    return current?.[field] ?? ''
  }

  function handleAccept() {
    startTransition(async () => {
      try {
        await acceptContract({
          contractId: contract.id,
          message: reviewMessage || undefined,
        })
        router.push(`/contracts/${contract.id}`)
        router.refresh()
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Failed to accept contract. Please try again.'
        )
      }
    })
  }

  function handleCounter() {
    if (!hasLocalChanges) {
      window.alert(
        "You haven't made any changes. Edit the terms or milestones before sending a counter-offer."
      )
      return
    }

    startTransition(async () => {
      try {
        await submitReview({
          contractId: contract.id,
          action: 'counter_offer',
          editedTerms,
          editedMilestones: editedMilestones.map((milestone, index) => ({
            ...milestone,
            due_date: milestone.due_date || null,
            order: milestone.order ?? index,
          })),
          changesSummary: getChangesSummary(),
          message: reviewMessage || undefined,
        })
        router.push(`/contracts/${contract.id}`)
        router.refresh()
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Failed to submit counter-offer. Please try again.'
        )
      }
    })
  }

  function handleReject() {
    const confirmed = window.confirm(
      'Reject this contract? This cannot be undone.'
    )
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        await rejectContract({
          contractId: contract.id,
          message: reviewMessage || 'Contract rejected.',
        })
        router.push('/contracts')
        router.refresh()
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : 'Failed to reject contract. Please try again.'
        )
      }
    })
  }

  return (
    <div className="w-full">
      <Link
        href={`/contracts/${contract.id}`}
        className={cn(
          'mb-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm',
          'text-[hsl(var(--color-text-3))] transition-colors duration-150',
          'hover:text-[hsl(var(--color-text-1))]'
        )}
      >
        <ArrowLeft size={16} />
        Back to contract
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold text-[hsl(var(--color-text-1))] sm:text-xl lg:text-2xl">
              Review Contract
            </h1>
            <span className="rounded-full bg-[hsl(var(--color-warning)/0.1)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--color-warning))]">
              Round {contract.review_round + 1}
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                NEGOTIATION_STATUS_COLORS[contract.negotiation_status]
              )}
            >
              {STATUS_LABELS[contract.state]}
            </span>
          </div>
          <p className="text-sm text-[hsl(var(--color-text-2))]">
            {canEdit
              ? `Review the terms from ${otherPartyName}. You can accept, edit and counter, or reject.`
              : `Waiting for ${otherPartyName} to review the contract.`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 py-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
          You: {ROLE_LABELS[userRole]}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 min-w-0 flex-col gap-5">
          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Contract Terms
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                  Title
                </label>
                {canEdit ? (
                  <input
                    value={editedTerms.title}
                    onChange={(event) =>
                      setEditedTerms((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    className={cn(
                      'min-h-[44px] w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                      'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]',
                      'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.5)]',
                      (incomingTermChanged('title') || localTermChanged('title')) &&
                        'border-[hsl(var(--color-warning))]'
                    )}
                  />
                ) : (
                  <p className="text-sm text-[hsl(var(--color-text-1))]">{editedTerms.title}</p>
                )}
                {(incomingTermChanged('title') || localTermChanged('title')) && (
                  <p className="text-[10px] text-[hsl(var(--color-warning))]">
                    Was: &quot;{String(baselineTermValue('title'))}&quot;
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                  Description
                </label>
                {canEdit ? (
                  <textarea
                    value={editedTerms.description}
                    onChange={(event) =>
                      setEditedTerms((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className={cn(
                      'w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                      'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))] resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.5)]',
                      (incomingTermChanged('description') ||
                        localTermChanged('description')) &&
                        'border-[hsl(var(--color-warning))]'
                    )}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                    {editedTerms.description}
                  </p>
                )}
                {(incomingTermChanged('description') ||
                  localTermChanged('description')) && (
                  <p className="text-[10px] text-[hsl(var(--color-warning))]">
                    Description changed in the last round.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                  Terms
                </label>
                {canEdit ? (
                  <textarea
                    value={editedTerms.terms}
                    onChange={(event) =>
                      setEditedTerms((previous) => ({
                        ...previous,
                        terms: event.target.value,
                      }))
                    }
                    rows={6}
                    className={cn(
                      'w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                      'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))] resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.5)]',
                      (incomingTermChanged('terms') || localTermChanged('terms')) &&
                        'border-[hsl(var(--color-warning))]'
                    )}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                    {editedTerms.terms || 'No additional terms recorded.'}
                  </p>
                )}
                {(incomingTermChanged('terms') || localTermChanged('terms')) && (
                  <p className="text-[10px] text-[hsl(var(--color-warning))]">
                    Terms changed in the last round.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                    Total Value ({contract.currency})
                  </label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={editedTerms.total_value}
                      onChange={(event) =>
                        setEditedTerms((previous) => ({
                          ...previous,
                          total_value: Number(event.target.value) || 0,
                        }))
                      }
                      className={cn(
                        'min-h-[44px] w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                        'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]',
                        (incomingTermChanged('total_value') ||
                          localTermChanged('total_value')) &&
                          'border-[hsl(var(--color-warning))]'
                      )}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {formatMajorAmount(editedTerms.total_value, contract.currency)}
                    </p>
                  )}
                  {(incomingTermChanged('total_value') ||
                    localTermChanged('total_value')) && (
                    <p className="text-[10px] text-[hsl(var(--color-warning))]">
                      Was: {formatMajorAmount(Number(baselineTermValue('total_value')), contract.currency)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                    Start Date
                  </label>
                  {canEdit ? (
                    <input
                      type="date"
                      value={editedTerms.start_date}
                      onChange={(event) =>
                        setEditedTerms((previous) => ({
                          ...previous,
                          start_date: event.target.value,
                        }))
                      }
                      className={cn(
                        'min-h-[44px] w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                        'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]',
                        (incomingTermChanged('start_date') ||
                          localTermChanged('start_date')) &&
                          'border-[hsl(var(--color-warning))]'
                      )}
                    />
                  ) : (
                    <p className="text-sm text-[hsl(var(--color-text-1))]">
                      {editedTerms.start_date || '—'}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                    End Date
                  </label>
                  {canEdit ? (
                    <input
                      type="date"
                      value={editedTerms.end_date}
                      onChange={(event) =>
                        setEditedTerms((previous) => ({
                          ...previous,
                          end_date: event.target.value,
                        }))
                      }
                      className={cn(
                        'min-h-[44px] w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                        'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]',
                        (incomingTermChanged('end_date') ||
                          localTermChanged('end_date')) &&
                          'border-[hsl(var(--color-warning))]'
                      )}
                    />
                  ) : (
                    <p className="text-sm text-[hsl(var(--color-text-1))]">
                      {editedTerms.end_date || '—'}
                    </p>
                  )}
                </div>
              </div>

              {Math.abs(milestonesTotal - editedTerms.total_value) > 0.01 && (
                <div
                  className={cn(
                    'flex flex-col gap-2 rounded-[var(--radius-md)] border px-3 py-2 sm:flex-row sm:items-center',
                    'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.08)]'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-[hsl(var(--color-warning))]"
                    />
                    <span className="text-xs text-[hsl(var(--color-warning))]">
                      Milestones total ({formatMajorAmount(milestonesTotal, contract.currency)}) does not match the contract value ({formatMajorAmount(editedTerms.total_value, contract.currency)}).
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={syncTotalWithMilestones}
                      className="min-h-[44px] text-left text-xs font-semibold text-[hsl(var(--color-warning))] underline sm:ml-auto sm:min-h-0"
                    >
                      Sync total
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Milestones ({editedMilestones.length})
              </h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={addMilestone}
                  className={cn(
                    'min-h-[44px] rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold',
                    'bg-[hsl(var(--color-accent)/0.08)] text-[hsl(var(--color-accent))]'
                  )}
                >
                  Add milestone
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {editedMilestones.map((milestone, index) => {
                const current = currentMilestones[index]
                const isNew = !current
                const titleChanged =
                  incomingMilestoneChanged(index, 'title') ||
                  localMilestoneChanged(index, 'title')
                const amountChanged =
                  incomingMilestoneChanged(index, 'amount') ||
                  localMilestoneChanged(index, 'amount')
                const descriptionChanged =
                  incomingMilestoneChanged(index, 'description') ||
                  localMilestoneChanged(index, 'description')
                const dueDateChanged =
                  incomingMilestoneChanged(index, 'due_date') ||
                  localMilestoneChanged(index, 'due_date')
                const changed =
                  isNew ||
                  titleChanged ||
                  amountChanged ||
                  descriptionChanged ||
                  dueDateChanged

                return (
                  <div
                    key={milestone.id || `milestone-${index}`}
                    className={cn(
                      'rounded-[var(--radius-lg)] border p-4',
                      changed
                        ? 'border-[hsl(var(--color-warning)/0.3)] bg-[hsl(var(--color-warning)/0.04)]'
                        : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg))]'
                    )}
                  >
                    {changed && (
                      <div className="mb-3 flex items-center gap-1.5">
                        <Edit3 size={11} className="text-[hsl(var(--color-warning))]" />
                        <span className="text-[10px] font-medium text-[hsl(var(--color-warning))]">
                          {isNew ? 'New milestone' : 'Modified'}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px_40px] sm:items-end">
                      <div>
                        <label className="mb-1 block text-[10px] text-[hsl(var(--color-text-3))]">
                          Milestone {index + 1}
                        </label>
                        {canEdit ? (
                          <input
                            value={milestone.title}
                            onChange={(event) =>
                              updateMilestone(index, 'title', event.target.value)
                            }
                            className={cn(
                              'min-h-[44px] w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                              'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-1))]',
                              titleChanged && 'border-[hsl(var(--color-warning))]'
                            )}
                            placeholder="Milestone title"
                          />
                        ) : (
                          <p className="text-sm text-[hsl(var(--color-text-1))]">
                            {milestone.title}
                          </p>
                        )}
                        {titleChanged && !isNew && (
                          <p className="mt-0.5 text-[10px] text-[hsl(var(--color-warning))]">
                            Was: {String(baselineMilestoneValue(index, 'title'))}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] text-[hsl(var(--color-text-3))]">
                          Amount
                        </label>
                        {canEdit ? (
                          <input
                            type="number"
                            value={milestone.amount}
                            onChange={(event) =>
                              updateMilestone(
                                index,
                                'amount',
                                Number(event.target.value) || 0
                              )
                            }
                            className={cn(
                              'min-h-[44px] w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                              'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-1))]',
                              amountChanged && 'border-[hsl(var(--color-warning))]'
                            )}
                          />
                        ) : (
                          <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                            {formatMajorAmount(milestone.amount, contract.currency)}
                          </p>
                        )}
                        {amountChanged && !isNew && (
                          <p className="mt-0.5 text-[10px] text-[hsl(var(--color-warning))]">
                            Was: {formatMajorAmount(Number(baselineMilestoneValue(index, 'amount')), contract.currency)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] text-[hsl(var(--color-text-3))]">
                          Due
                        </label>
                        {canEdit ? (
                          <input
                            type="date"
                            value={milestone.due_date}
                            onChange={(event) =>
                              updateMilestone(index, 'due_date', event.target.value)
                            }
                            className={cn(
                              'min-h-[44px] w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                              'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-1))]',
                              dueDateChanged && 'border-[hsl(var(--color-warning))]'
                            )}
                          />
                        ) : (
                          <p className="text-sm text-[hsl(var(--color-text-1))]">
                            {milestone.due_date || '—'}
                          </p>
                        )}
                      </div>

                      {canEdit && editedMilestones.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className={cn(
                            'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)]',
                            'text-[hsl(var(--color-danger))] hover:bg-[hsl(var(--color-danger)/0.1)]'
                          )}
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>

                    {canEdit ? (
                      <textarea
                        value={milestone.description}
                        onChange={(event) =>
                          updateMilestone(index, 'description', event.target.value)
                        }
                        rows={2}
                        className={cn(
                          'mt-3 w-full rounded-[var(--radius-sm)] border px-3 py-2 text-xs',
                          'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-2))] resize-none',
                          descriptionChanged && 'border-[hsl(var(--color-warning))]'
                        )}
                        placeholder="Describe this milestone deliverable..."
                      />
                    ) : milestone.description ? (
                      <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                        {milestone.description}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--color-border))] pt-4">
              <span className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                Milestones total
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  Math.abs(milestonesTotal - editedTerms.total_value) < 0.01
                    ? 'text-[hsl(var(--color-success))]'
                    : 'text-[hsl(var(--color-warning))]'
                )}
              >
                {formatMajorAmount(milestonesTotal, contract.currency)}
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
            <label className="mb-3 block text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Message to {otherPartyName}
            </label>
            <textarea
              value={reviewMessage}
              onChange={(event) => setReviewMessage(event.target.value)}
              rows={3}
              placeholder={
                canEdit
                  ? 'Explain your changes or add context for the other party...'
                  : 'Add a note with your response...'
              }
              className={cn(
                'w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm',
                'bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))] resize-none'
              )}
            />
          </div>

          {canEdit ? (
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isPending}
                  className={cn(
                    'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-3 text-sm font-semibold text-white',
                    'bg-[hsl(var(--color-success))] transition-all duration-200 hover:brightness-110',
                    'disabled:opacity-50'
                  )}
                >
                  <Check size={16} />
                  Accept Terms
                </button>
                <button
                  type="button"
                  onClick={handleCounter}
                  disabled={isPending || !hasLocalChanges}
                  className={cn(
                    'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-3 text-sm font-semibold text-white',
                    'bg-[hsl(var(--color-warning))] transition-all duration-200 hover:brightness-110',
                    'disabled:opacity-50'
                  )}
                >
                  <Send size={16} />
                  {hasLocalChanges ? 'Send Counter-Offer' : 'Edit to Counter'}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isPending}
                  className={cn(
                    'flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-md)] border px-5 py-3 text-sm font-semibold',
                    'border-[hsl(var(--color-danger)/0.3)] text-[hsl(var(--color-danger))]',
                    'hover:bg-[hsl(var(--color-danger)/0.08)] disabled:opacity-50'
                  )}
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
              <Clock size={16} className="shrink-0 text-[hsl(var(--color-text-3))]" />
              <p className="text-sm text-[hsl(var(--color-text-2))]">
                Waiting for <span className="font-medium text-[hsl(var(--color-text-1))]">{otherPartyName}</span> to review the latest terms.
              </p>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-[320px]">
          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className={cn(
              'mb-3 flex w-full items-center justify-between rounded-[var(--radius-xl)] border p-4 lg:hidden',
              'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
            )}
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-[hsl(var(--color-text-3))]" />
              <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                Negotiation History ({reviews.length})
              </span>
            </div>
            {showHistory ? (
              <ChevronUp size={16} className="text-[hsl(var(--color-text-3))]" />
            ) : (
              <ChevronDown size={16} className="text-[hsl(var(--color-text-3))]" />
            )}
          </button>

          <div className={cn(showHistory ? 'block' : 'hidden lg:block')}>
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5 lg:sticky lg:top-8">
              <h3 className="mb-4 hidden text-sm font-semibold text-[hsl(var(--color-text-1))] lg:block">
                Negotiation History
              </h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-[hsl(var(--color-text-3))]">
                  No review history yet.
                </p>
              ) : (
                <div className="flex flex-col gap-0">
                  {reviews.map((review, index) => {
                    const reviewerName =
                      review.reviewer_id === currentUserId
                        ? 'You'
                        : review.reviewer?.full_name ||
                          review.reviewer?.email ||
                          'Other party'
                    const actionLabels: Record<string, string> = {
                      initial_draft: 'created the contract',
                      review_edit: 'edited the contract',
                      counter_offer: 'sent a counter-offer',
                      accept: 'accepted the terms',
                      reject: 'rejected the contract',
                    }
                    const actionColors: Record<string, string> = {
                      initial_draft: 'text-[hsl(var(--color-accent))]',
                      review_edit: 'text-[hsl(var(--color-warning))]',
                      counter_offer: 'text-[hsl(var(--color-warning))]',
                      accept: 'text-[hsl(var(--color-success))]',
                      reject: 'text-[hsl(var(--color-danger))]',
                    }

                    return (
                      <div key={review.id} className="relative">
                        {index < reviews.length - 1 && (
                          <div className="absolute bottom-0 left-[11px] top-[28px] w-px bg-[hsl(var(--color-border))]" />
                        )}

                        <div className="flex gap-3 pb-5">
                          <div
                            className={cn(
                              'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2',
                              review.action === 'accept'
                                ? 'border-[hsl(var(--color-success))] bg-[hsl(var(--color-success)/0.15)]'
                                : review.action === 'reject'
                                  ? 'border-[hsl(var(--color-danger))] bg-[hsl(var(--color-danger)/0.15)]'
                                  : review.action === 'counter_offer'
                                    ? 'border-[hsl(var(--color-warning))] bg-[hsl(var(--color-warning)/0.15)]'
                                    : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
                            )}
                          >
                            <span className="text-[8px] font-bold text-[hsl(var(--color-text-3))]">
                              {review.round}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[hsl(var(--color-text-2))]">
                              <span className="font-medium text-[hsl(var(--color-text-1))]">
                                {reviewerName}
                              </span>{' '}
                              <span className={actionColors[review.action] || ''}>
                                {actionLabels[review.action] || review.action}
                              </span>
                            </p>

                            {review.changes_summary.length > 0 && (
                              <div className="mt-1.5 flex flex-col gap-0.5">
                                {review.changes_summary.map((change, changeIndex) => (
                                  <p
                                    key={`${review.id}-${changeIndex}`}
                                    className="text-[10px] leading-relaxed text-[hsl(var(--color-text-3))]"
                                  >
                                    • {change}
                                  </p>
                                ))}
                              </div>
                            )}

                            {review.message && (
                              <div className="mt-2 rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg))] px-2.5 py-2">
                                <div className="mb-1 flex items-center gap-1">
                                  <MessageSquare
                                    size={9}
                                    className="text-[hsl(var(--color-text-3))]"
                                  />
                                  <span className="text-[9px] text-[hsl(var(--color-text-3))]">
                                    Message
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-[hsl(var(--color-text-2))]">
                                  {review.message}
                                </p>
                              </div>
                            )}

                            <p className="mt-1 text-[10px] text-[hsl(var(--color-text-3))]">
                              {new Date(review.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
