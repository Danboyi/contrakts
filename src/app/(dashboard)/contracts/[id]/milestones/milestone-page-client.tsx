'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ReviewModal,
  RevisionBanner,
  SubmissionForm,
  SubmissionTimeline,
} from '@/components/submissions'
import { CountdownTimer } from '@/components/contracts/countdown-timer'
import { DeliverableCard } from '@/components/contracts/deliverable-card'
import { useMilestones } from '@/hooks/use-milestones'
import { useSubmissions } from '@/hooks/use-submissions'
import { approveMilestone } from '@/lib/milestones/actions'
import { Avatar } from '@/components/ui/avatar'
import { MilestoneStateBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDate, formatRelative } from '@/lib/utils/format-date'
import type { Contract, Milestone } from '@/types'
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  Lock,
} from 'lucide-react'

type MilestoneDetailContract = Contract & {
  initiator: NonNullable<Contract['initiator']> | null
  counterparty: NonNullable<Contract['counterparty']> | null
  milestones: Milestone[]
}

interface MilestonePageClientProps {
  contract: MilestoneDetailContract
  currentUserId: string
  initialAction?: string
  initialMilestoneId?: string
}

function getServiceProviderId(contract: Contract) {
  return (
    contract.service_provider_id ??
    (contract.initiator_role === 'service_provider'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

function getServiceReceiverId(contract: Contract) {
  return (
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

function getServiceProviderProfile(contract: MilestoneDetailContract) {
  const providerId = getServiceProviderId(contract)
  if (!providerId) {
    return contract.counterparty
  }

  return providerId === contract.initiator_id
    ? contract.initiator
    : contract.counterparty
}

export function MilestonePageClient({
  contract,
  currentUserId,
  initialAction,
  initialMilestoneId,
}: MilestonePageClientProps) {
  const router = useRouter()
  const { milestones, activeMilestone, paidMilestones } = useMilestones(
    contract.id,
    contract.milestones ?? []
  )

  const [selectedId, setSelectedId] = useState<string | null>(
    initialMilestoneId ?? activeMilestone?.id ?? contract.milestones?.[0]?.id ?? null
  )
  const [approveModal, setApproveModal] = useState(false)
  const [didHandleInitialApprove, setDidHandleInitialApprove] = useState(false)
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(
    null
  )
  const [isPending, startTransition] = useTransition()

  const serviceProviderId = getServiceProviderId(contract)
  const serviceReceiverId = getServiceReceiverId(contract)
  const isProvider = serviceProviderId === currentUserId
  const isReceiver = serviceReceiverId === currentUserId

  const selected =
    milestones.find((milestone) => milestone.id === selectedId) ??
    activeMilestone ??
    milestones[0] ??
    null

  const {
    submissions,
    currentVersion,
    canSubmitNew,
    loading: submissionsLoading,
  } = useSubmissions(selected?.id ?? '')

  const hasSubmissions = submissions.length > 0
  const latestSubmission = submissions[0] ?? null
  const reviewingSubmission =
    submissions.find((submission) => submission.id === reviewingSubmissionId) ?? null
  const serviceProvider = getServiceProviderProfile(contract)

  const completedMilestones = useMemo(
    () => paidMilestones.filter((milestone) => milestone.id !== selected?.id),
    [paidMilestones, selected?.id]
  )

  useEffect(() => {
    if (!selectedId && activeMilestone) {
      setSelectedId(activeMilestone.id)
      return
    }

    if (!selectedId && milestones[0]) {
      setSelectedId(milestones[0].id)
    }
  }, [activeMilestone, milestones, selectedId])

  useEffect(() => {
    if (
      initialMilestoneId &&
      milestones.some((milestone) => milestone.id === initialMilestoneId)
    ) {
      setSelectedId((current) => current ?? initialMilestoneId)
    }
  }, [initialMilestoneId, milestones])

  useEffect(() => {
    if (
      didHandleInitialApprove ||
      initialAction !== 'approve' ||
      !initialMilestoneId ||
      selected?.id !== initialMilestoneId ||
      selected.state !== 'submitted' ||
      hasSubmissions
    ) {
      return
    }

    setApproveModal(true)
    setDidHandleInitialApprove(true)
  }, [
    didHandleInitialApprove,
    hasSubmissions,
    initialAction,
    initialMilestoneId,
    selected?.id,
    selected?.state,
  ])

  function handleApprove() {
    if (!selected) {
      return
    }

    startTransition(async () => {
      const result = await approveMilestone(selected.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setApproveModal(false)
      toast.success('Milestone approved. Payment is being released.')
    })
  }

  function handleDispute() {
    if (!selected) {
      return
    }

    router.push(`/contracts/${contract.id}/dispute?milestone=${selected.id}`)
  }

  function openReviewModal(submissionId: string) {
    setReviewingSubmissionId(submissionId)
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/contracts/${contract.id}`)}
          className={cn(
            'rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))] transition-all duration-150',
            'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
          )}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--color-text-1))]">
            Milestones
          </h1>
          <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
            {contract.ref_code} - {contract.title}
          </p>
        </div>
      </div>

      <div className="-mx-4 mb-6 w-full overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
        <div className="flex min-w-max gap-1.5 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-1">
          {milestones.map((milestone, index) => {
            const isActive = (selected?.id ?? activeMilestone?.id) === milestone.id
            const isPaid = milestone.state === 'paid'
            const isLocked = milestone.state === 'pending'

            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => setSelectedId(milestone.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-[calc(var(--radius-md)-2px)] px-3 py-2 text-sm whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))] shadow-sm'
                    : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                {isPaid ? (
                  <CheckCircle size={12} className="text-[hsl(var(--color-success))]" />
                ) : isLocked ? (
                  <Lock size={12} className="text-[hsl(var(--color-text-3))]" />
                ) : (
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      milestone.state === 'submitted' && 'bg-[hsl(var(--color-warning))]',
                      milestone.state === 'disputed' && 'bg-[hsl(var(--color-danger))]',
                      milestone.state === 'approved' && 'bg-[hsl(var(--color-success))]',
                      milestone.state === 'in_progress' &&
                        'animate-pulse bg-[hsl(var(--color-accent))]'
                    )}
                  />
                )}
                {index + 1}.{' '}
                {milestone.title.length > 20
                  ? `${milestone.title.slice(0, 20)}...`
                  : milestone.title}
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div
          className={cn(
            'mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-l-2 bg-[hsl(var(--color-surface))]',
            selected.state === 'paid' && 'border-l-[hsl(var(--color-success))]',
            selected.state === 'submitted' && 'border-l-[hsl(var(--color-warning))]',
            selected.state === 'disputed' && 'border-l-[hsl(var(--color-danger))]',
            selected.state === 'in_progress' && 'border-l-[hsl(var(--color-accent))]',
            selected.state === 'pending' && 'border-l-[hsl(var(--color-border))]',
            selected.state === 'approved' && 'border-l-[hsl(var(--color-success))]'
          )}
        >
          <div className="p-5 pb-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-[hsl(var(--color-text-3))]">
                  Milestone {milestones.findIndex((milestone) => milestone.id === selected.id) + 1}
                  {selected.deadline ? ` - Due ${formatDate(selected.deadline)}` : ''}
                </p>
                <h2 className="text-lg font-semibold leading-snug text-[hsl(var(--color-text-1))]">
                  {selected.title}
                </h2>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <MilestoneStateBadge state={selected.state} />
                <p
                  className={cn(
                    'text-base font-semibold',
                    selected.state === 'paid'
                      ? 'text-[hsl(var(--color-success))]'
                      : 'text-[hsl(var(--color-text-1))]'
                  )}
                >
                  {formatCurrency(selected.amount, contract.currency)}
                </p>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {selected.description}
              </p>
            )}
          </div>

          <Separator />
          {selected.state === 'paid' && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
                  <CheckCircle size={18} className="text-[hsl(var(--color-success))]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--color-success))]">
                    Payment released
                  </p>
                  {selected.paid_at && (
                    <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                      {formatRelative(selected.paid_at)}
                      {selected.auto_released ? ' - Auto-released' : ''}
                    </p>
                  )}
                </div>
              </div>

              {selected.deliverables && selected.deliverables.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                    Deliverables
                  </p>
                  {selected.deliverables.map((deliverable) => (
                    <DeliverableCard key={deliverable.id} deliverable={deliverable} />
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.state === 'approved' && (
            <div className="p-5">
              <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.06)] p-4">
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-[hsl(var(--color-success))]"
                />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--color-success))]">
                    Approved. Payment release is processing.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    The release has been queued and the milestone will move to paid
                    once the payout provider confirms the transfer.
                  </p>
                </div>
              </div>

              {selected.deliverables && selected.deliverables.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                    Approved deliverables
                  </p>
                  {selected.deliverables.map((deliverable) => (
                    <DeliverableCard key={deliverable.id} deliverable={deliverable} />
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.state === 'in_progress' && isProvider && !hasSubmissions && (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <Clock size={24} className="mb-3 text-[hsl(var(--color-text-3))]" />
              <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                Ready to submit
              </p>
              <p className="max-w-xs text-xs text-[hsl(var(--color-text-3))]">
                Upload files, share links, or send code previews when this milestone
                is ready for review.
              </p>
            </div>
          )}

          {selected.state === 'in_progress' && isReceiver && !hasSubmissions && (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <Clock size={24} className="mb-3 text-[hsl(var(--color-text-3))]" />
              <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                Awaiting delivery
              </p>
              <p className="max-w-xs text-xs text-[hsl(var(--color-text-3))]">
                {serviceProvider?.full_name ?? 'The service provider'} is working on
                this milestone. You will be notified when the delivery is submitted.
              </p>
            </div>
          )}

          {selected.state === 'submitted' && !hasSubmissions && (
            <div className="p-5">
              {selected.submitted_at && (
                <div className="mb-5">
                  <CountdownTimer submittedAt={selected.submitted_at} />
                </div>
              )}

              {selected.deliverables && selected.deliverables.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                    Submitted deliverables ({selected.deliverables.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {selected.deliverables.map((deliverable) => (
                      <DeliverableCard key={deliverable.id} deliverable={deliverable} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
                <Avatar
                  name={serviceProvider?.full_name ?? 'Service Provider'}
                  src={serviceProvider?.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">Submitted by</p>
                  <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {serviceProvider?.full_name ?? 'Service Provider'}
                  </p>
                </div>
                {selected.submitted_at && (
                  <p className="shrink-0 text-xs text-[hsl(var(--color-text-3))]">
                    {formatRelative(selected.submitted_at)}
                  </p>
                )}
              </div>

              {isReceiver && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" onClick={() => setApproveModal(true)}>
                    Approve and release payment
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDispute}
                    className="text-[hsl(var(--color-danger))] hover:bg-[hsl(var(--color-danger)/0.08)]"
                  >
                    Raise dispute
                  </Button>
                </div>
              )}

              {isProvider && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-3">
                  <Clock size={13} className="text-[hsl(var(--color-warning))]" />
                  <p className="text-xs text-[hsl(var(--color-text-2))]">
                    Waiting for service receiver review. Payment auto-releases after 72 hours.
                  </p>
                </div>
              )}
            </div>
          )}

          {selected.state === 'submitted' && hasSubmissions && (
            <div className="p-5">
              {selected.submitted_at && (
                <div className="mb-5">
                  <CountdownTimer submittedAt={selected.submitted_at} />
                </div>
              )}

              {isReceiver ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-3">
                    <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                      Review the latest submission below
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--color-text-2))]">
                      Approve it, request revisions, or reject it with feedback.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleDispute}
                    className="text-[hsl(var(--color-danger))] hover:bg-[hsl(var(--color-danger)/0.08)]"
                  >
                    Raise dispute
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-3">
                  <Clock size={13} className="text-[hsl(var(--color-warning))]" />
                  <p className="text-xs text-[hsl(var(--color-text-2))]">
                    Waiting for service receiver review. Payment auto-releases after 72 hours.
                  </p>
                </div>
              )}
            </div>
          )}

          {selected.state === 'disputed' && (
            <div className="p-5">
              <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-danger)/0.2)] bg-[hsl(var(--color-danger)/0.06)] p-4">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-[hsl(var(--color-danger))]"
                />
                <div>
                  <p className="mb-1 text-sm font-medium text-[hsl(var(--color-danger))]">
                    Dispute in progress
                  </p>
                  <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    Payment is frozen while Contrakts reviews the evidence submitted by
                    both parties.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/contracts/${contract.id}/dispute?milestone=${selected.id}`)
                }
              >
                View dispute details
              </Button>
            </div>
          )}

          {selected.state === 'pending' && (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <Lock size={20} className="mb-3 text-[hsl(var(--color-text-3))]" />
              <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                Not started yet
              </p>
              <p className="max-w-xs text-xs text-[hsl(var(--color-text-3))]">
                This milestone unlocks only after the previous milestone is approved
                and paid.
              </p>
            </div>
          )}

          {(hasSubmissions || (isProvider && selected.state === 'in_progress')) && (
            <>
              <Separator />
              <div className="flex flex-col gap-5 p-5">
                {latestSubmission ? (
                  <RevisionBanner
                    submission={latestSubmission}
                    isProvider={isProvider}
                  />
                ) : null}

                <SubmissionTimeline
                  submissions={submissions}
                  loading={submissionsLoading}
                  isReceiver={isReceiver}
                  onReview={openReviewModal}
                />

                {isProvider && selected.state === 'in_progress' && canSubmitNew && (
                  <SubmissionForm
                    contractId={contract.id}
                    milestoneId={selected.id}
                    version={currentVersion + 1}
                    onSuccess={() => {
                      toast.success(
                        `Submission v${currentVersion + 1} sent for review.`
                      )
                    }}
                  />
                )}

                {isProvider &&
                  selected.state === 'in_progress' &&
                  hasSubmissions &&
                  !canSubmitNew &&
                  latestSubmission && (
                    <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-3">
                      <p className="text-xs text-[hsl(var(--color-text-2))]">
                        Submission v{latestSubmission.version} is still under review.
                        You can submit a new version after the service receiver responds.
                      </p>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      )}

      {completedMilestones.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Completed milestones
          </h2>
          <div className="flex flex-col gap-3">
            {completedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 opacity-70"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
                    <CheckCircle size={14} className="text-[hsl(var(--color-success))]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                      {milestone.title}
                    </p>
                    {milestone.paid_at && (
                      <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                        Paid {formatRelative(milestone.paid_at)}
                        {milestone.auto_released ? ' - Auto-released' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[hsl(var(--color-success))]">
                  {formatCurrency(milestone.amount, contract.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={approveModal}
        onOpenChange={setApproveModal}
        title="Approve milestone"
        description="This action cannot be undone."
        size="sm"
      >
        {selected && (
          <div className="mb-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
            <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
              You are approving{' '}
              <strong className="text-[hsl(var(--color-text-1))]">
                {selected.title}
              </strong>
              .{' '}
              <strong className="text-[hsl(var(--color-success))]">
                {formatCurrency(selected.amount, contract.currency)}
              </strong>{' '}
              will be released to{' '}
              <strong className="text-[hsl(var(--color-text-1))]">
                {serviceProvider?.full_name ?? 'the service provider'}
              </strong>
              . This cannot be undone.
            </p>
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setApproveModal(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            loading={isPending}
            onClick={handleApprove}
            leftIcon={<DollarSign size={15} />}
          >
            Approve and release
          </Button>
        </ModalFooter>
      </Modal>

      {reviewingSubmission ? (
        <ReviewModal
          submission={reviewingSubmission}
          onClose={() => setReviewingSubmissionId(null)}
          onReviewed={() => {
            setReviewingSubmissionId(null)
          }}
        />
      ) : null}
    </div>
  )
}
