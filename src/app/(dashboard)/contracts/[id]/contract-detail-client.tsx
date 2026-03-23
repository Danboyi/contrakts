'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Check,
  ChevronLeft,
  ChevronDown,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  ExternalLink,
  Layers,
  MoreHorizontal,
  PenTool,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import { ActionBanner } from '@/components/contracts/action-banner'
import { FundingPrompt } from '@/components/contracts/funding-prompt'
import { MilestoneTracker } from '@/components/contracts/milestone-tracker'
import { MessageThread } from '@/components/messages'
import { PartyCard } from '@/components/contracts/party-card'
import { EscrowBar } from '@/components/payments/escrow-bar'
import { ActivityItem } from '@/components/shared/activity-item'
import { ContractStateBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Separator } from '@/components/ui/separator'
import { useContract } from '@/hooks/use-contract'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { voidContract } from '@/lib/contracts/actions'
import {
  acceptContract,
  rejectContract,
} from '@/lib/contracts/negotiation-actions'
import { saveContractAsTemplate } from '@/lib/templates/actions'
import { getContractDisplayState } from '@/lib/contracts/state'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatDateTime } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Contract, Milestone } from '@/types'

type DetailContract = Contract & {
  initiator: NonNullable<Contract['initiator']> | null
  counterparty: NonNullable<Contract['counterparty']> | null
  milestones: Milestone[]
}

type Banner =
  | {
      variant: 'accent' | 'warning' | 'danger' | 'success' | 'neutral'
      message: string
      cta?: {
        label: string
        onClick: () => void
        loading?: boolean
      }
    }
  | null

type ActivityFeedItem = {
  id: string
  event_type: string
  payload: Record<string, unknown> | null
  created_at: string
  actor: { full_name: string } | null
}

function normalizeActivityItem(
  item: Record<string, unknown> & {
    actor?: { full_name: string } | { full_name: string }[] | null
  }
): ActivityFeedItem {
  return {
    id: String(item.id),
    event_type: String(item.event_type),
    payload: (item.payload as Record<string, unknown> | null) ?? null,
    created_at: String(item.created_at),
    actor: Array.isArray(item.actor) ? (item.actor[0] ?? null) : item.actor ?? null,
  }
}

export function ContractDetailClient({
  initialContract,
  currentUserId,
}: {
  initialContract: DetailContract
  currentUserId: string
}) {
  const router = useRouter()
  const { contract: liveContract } = useContract(initialContract.id)
  const contract = (liveContract ?? initialContract) as DetailContract
  const [isPending, startTransition] = useTransition()
  const [voidModal, setVoidModal] = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const isInitiator = contract.initiator_id === currentUserId
  const isCounterparty = contract.counterparty_id === currentUserId
  const isServiceReceiver =
    contract.service_receiver_id === currentUserId ||
    (!contract.service_receiver_id &&
      ((isInitiator && contract.initiator_role === 'service_receiver') ||
        (isCounterparty && contract.initiator_role === 'service_provider')))
  const isServiceProvider =
    contract.service_provider_id === currentUserId ||
    (!contract.service_provider_id &&
      ((isInitiator && contract.initiator_role === 'service_provider') ||
        (isCounterparty && contract.initiator_role === 'service_receiver')))
  const otherPartyName = isInitiator
    ? contract.counterparty?.full_name ??
      contract.counterparty?.email ??
      'the other party'
    : contract.initiator?.full_name ??
      contract.initiator?.email ??
      'the other party'
  const isNegotiationOpen = ['pending_review', 'in_review', 'countered'].includes(
    contract.negotiation_status
  )
  const isUsersTurn =
    isNegotiationOpen && contract.current_reviewer_id === currentUserId
  const displayState = getContractDisplayState(contract)
  const receiverSigned =
    contract.signed_by_receiver || Boolean(contract.receiver_signed_at)
  const providerSigned =
    contract.signed_by_provider || Boolean(contract.provider_signed_at)

  const milestones = [...(contract.milestones ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  const inviteLink = contract.invite_token
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/invite/${contract.invite_token}`
    : ''

  function copyInviteLink() {
    if (!inviteLink) {
      toast.error('No invite link is available for this contract.')
      return
    }

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success('Invite link copied')
      })
      .catch(() => {
        toast.error('Could not copy the invite link')
      })
  }

  function getBanner(): Banner {
    if (isNegotiationOpen) {
      return null
    }

    if (['funded', 'active'].includes(contract.state) && isServiceProvider) {
      const nextMilestone = milestones.find((milestone) =>
        ['pending', 'in_progress'].includes(milestone.state)
      )

      if (nextMilestone) {
        return {
          variant: 'accent',
          message:
            'Work has begun. Submit your next milestone when the delivery is ready.',
          cta: {
            label: 'Submit delivery',
            onClick: () =>
              router.push(
                `/contracts/${contract.id}/milestones?action=submit&id=${nextMilestone.id}`
              ),
          },
        }
      }
    }

    if (contract.state === 'in_review' && isServiceReceiver) {
      const submittedMilestone = milestones.find(
        (milestone) => milestone.state === 'submitted'
      )

      if (submittedMilestone) {
        return {
          variant: 'warning',
          message: `Milestone "${submittedMilestone.title}" has been submitted for your review.`,
          cta: {
            label: 'Review delivery',
            onClick: () =>
              router.push(
                `/contracts/${contract.id}/milestones?action=approve&id=${submittedMilestone.id}`
              ),
          },
        }
      }
    }

    if (contract.state === 'disputed') {
      return {
        variant: 'danger',
        message:
          'A dispute is open on this contract. Arbitration is in progress.',
      }
    }

    if (contract.state === 'complete') {
      return {
        variant: 'success',
        message:
          'This contract has been completed successfully. All payments released.',
      }
    }

    if (contract.state === 'voided') {
      return {
        variant: 'neutral',
        message: 'This contract has been voided. No funds were moved.',
      }
    }

    return null
  }

  const banner = getBanner()

  function handleVoid() {
    startTransition(async () => {
      const result = await voidContract(contract.id)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Contract voided.')
      setVoidModal(false)
      router.push('/contracts')
    })
  }

  function handleApprove(milestoneId: string) {
    router.push(`/contracts/${contract.id}/milestones?action=approve&id=${milestoneId}`)
  }

  function handleDispute(milestoneId: string) {
    router.push(`/contracts/${contract.id}/dispute?milestone=${milestoneId}`)
  }

  function handleSubmit(milestoneId: string) {
    router.push(`/contracts/${contract.id}/milestones?action=submit&id=${milestoneId}`)
  }

  function handleAcceptTerms() {
    startTransition(async () => {
      try {
        await acceptContract({
          contractId: contract.id,
        })
        toast.success('Contract accepted.')
        router.push(`/contracts/${contract.id}`)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to accept contract. Please try again.'
        )
      }
    })
  }

  function handleRejectTerms() {
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
          message: 'Contract rejected.',
        })
        toast.success('Contract rejected.')
        router.push('/contracts')
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to reject contract. Please try again.'
        )
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="mb-6">
        <Link
          href="/contracts"
          className={cn(
            'mb-4 inline-flex items-center gap-1.5 text-sm',
            'text-[hsl(var(--color-text-3))] transition-colors duration-150',
            'hover:text-[hsl(var(--color-text-2))]'
          )}
        >
          <ChevronLeft size={16} />
          Contracts
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 font-mono text-[11px] tracking-wide text-[hsl(var(--color-text-3))]">
              {contract.ref_code}
            </p>
            <h1 className="text-xl font-semibold leading-tight text-[hsl(var(--color-text-1))] sm:text-2xl">
              {contract.title}
            </h1>
            {contract.description && (
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {contract.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ContractStateBadge state={displayState} />
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                Created {formatDate(contract.created_at)}
              </span>
              {contract.end_date && (
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  Due {formatDate(contract.end_date)}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {isUsersTurn && (
              <Button
                size="md"
                leftIcon={<Check size={13} />}
                onClick={handleAcceptTerms}
                loading={isPending}
                className="w-full bg-[hsl(var(--color-success))] text-white hover:brightness-110 sm:w-auto"
              >
                Accept
              </Button>
            )}
            {isUsersTurn && (
              <Button
                size="md"
                leftIcon={<Edit3 size={13} />}
                onClick={() => router.push(`/contracts/${contract.id}/review`)}
                className="w-full bg-[hsl(var(--color-warning))] text-white hover:brightness-110 sm:w-auto"
              >
                Review &amp; Respond
              </Button>
            )}
            {isUsersTurn && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<X size={13} />}
                onClick={handleRejectTerms}
                loading={isPending}
                className="w-full border-[hsl(var(--color-danger)/0.3)] text-[hsl(var(--color-danger))] hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))] sm:w-auto"
              >
                Reject
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Share2 size={13} />}
              onClick={() => setShareModal(true)}
              className="w-full sm:w-auto"
            >
              Share
            </Button>
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="secondary" size="icon" className="self-end sm:self-auto">
                  <MoreHorizontal size={15} />
                </Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                <DropdownLabel>Contract</DropdownLabel>
                <DropdownItem leftIcon={<Copy size={13} />} onClick={copyInviteLink}>
                  Copy invite link
                </DropdownItem>
                <DropdownItem
                  leftIcon={<DollarSign size={13} />}
                  onClick={() => router.push(`/contracts/${contract.id}/payments`)}
                >
                  Payment ledger
                </DropdownItem>
                {isInitiator && (
                  <DropdownItem
                    leftIcon={<Layers size={13} />}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await saveContractAsTemplate(contract.id)

                        if (result.error) {
                          toast.error(result.error)
                          return
                        }

                        toast.success('Template saved.')
                        router.push('/templates')
                      })
                    }
                  >
                    Save as template
                  </DropdownItem>
                )}
                <DropdownItem
                  leftIcon={<ExternalLink size={13} />}
                  onClick={() => setTermsOpen(true)}
                >
                  View full terms
                </DropdownItem>
                {['draft', 'pending'].includes(contract.state) && (
                  <>
                    <DropdownSeparator />
                    <DropdownItem
                      danger
                      leftIcon={<Trash2 size={13} />}
                      onClick={() => setVoidModal(true)}
                    >
                      Void contract
                    </DropdownItem>
                  </>
                )}
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isNegotiationOpen && (
        <div
          className={cn(
            'mb-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border p-4 sm:flex-row sm:items-center',
            'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)]'
          )}
        >
          <Clock
            size={16}
            className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))] sm:mt-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
              {isUsersTurn
                ? 'Your turn to review'
                : `Waiting for ${otherPartyName} to respond`}
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--color-text-2))]">
              Negotiation round {contract.review_round + 1}
              {contract.last_reviewed_at &&
                ` • Last activity ${formatDate(contract.last_reviewed_at)}`}
            </p>
          </div>
          {isUsersTurn && (
            <Link
              href={`/contracts/${contract.id}/review`}
              className={cn(
                'flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-xs font-semibold text-white sm:w-auto',
                'bg-[hsl(var(--color-warning))]'
              )}
            >
              <Edit3 size={13} />
              Review now
            </Link>
          )}
        </div>
      )}

      {contract.state === 'accepted' && isServiceReceiver && (
        <div
          className={cn(
            'mb-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border p-4 sm:flex-row sm:items-center',
            'border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.06)]'
          )}
        >
          <Check
            size={16}
            className="flex-shrink-0 text-[hsl(var(--color-success))]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
              Terms accepted. Ready to sign.
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--color-text-2))]">
              As the service receiver, you sign first. Then the service provider
              counter-signs.
            </p>
          </div>
          <Link
            href={`/contracts/${contract.id}/sign`}
            className={cn(
              'flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-xs font-semibold text-white sm:w-auto',
              'bg-[hsl(var(--color-success))]'
            )}
          >
            <PenTool size={13} />
            Sign contract
          </Link>
        </div>
      )}

      {contract.state === 'accepted' && isServiceProvider && !receiverSigned && (
        <div
          className={cn(
            'mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border p-4',
            'border-[hsl(var(--color-accent)/0.15)] bg-[hsl(var(--color-accent)/0.06)]'
          )}
        >
          <Clock
            size={16}
            className="flex-shrink-0 text-[hsl(var(--color-accent))]"
          />
          <p className="text-sm text-[hsl(var(--color-text-2))]">
            Terms are accepted. Waiting for the service receiver to sign first.
          </p>
        </div>
      )}

      {contract.state === 'signing' && receiverSigned && !providerSigned && isServiceReceiver && (
        <div
          className={cn(
            'mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border p-4',
            'border-[hsl(var(--color-accent)/0.15)] bg-[hsl(var(--color-accent)/0.06)]'
          )}
        >
          <Clock
            size={16}
            className="flex-shrink-0 text-[hsl(var(--color-accent))]"
          />
          <p className="text-sm text-[hsl(var(--color-text-2))]">
            You&apos;ve signed. Waiting for the service provider to counter-sign.
          </p>
        </div>
      )}

      {contract.state === 'signing' && receiverSigned && !providerSigned && isServiceProvider && (
        <div
          className={cn(
            'mb-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border p-4 sm:flex-row sm:items-center',
            'border-[hsl(var(--color-accent)/0.15)] bg-[hsl(var(--color-accent)/0.06)]'
          )}
        >
          <PenTool
            size={16}
            className="flex-shrink-0 text-[hsl(var(--color-accent))]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
              The service receiver has signed. Your turn to counter-sign.
            </p>
          </div>
          <Link
            href={`/contracts/${contract.id}/sign`}
            className={cn(
              'flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-xs font-semibold text-white sm:w-auto',
              'bg-[hsl(var(--color-accent))]'
            )}
          >
            <PenTool size={13} />
            Counter-sign
          </Link>
        </div>
      )}

      {contract.state === 'signed' && (
        <FundingPrompt
          contract={contract}
          milestones={milestones}
          currentUserId={currentUserId}
        />
      )}

      {contract.state === 'signed' && isServiceProvider && (
        <div
          className={cn(
            'mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border p-4',
            'border-[hsl(var(--color-accent)/0.15)] bg-[hsl(var(--color-accent)/0.06)]'
          )}
        >
          <Clock
            size={16}
            className="flex-shrink-0 text-[hsl(var(--color-accent))]"
          />
          <p className="text-sm text-[hsl(var(--color-text-2))]">
            Both parties have signed. Waiting for the service receiver to fund
            the escrow before work begins.
          </p>
        </div>
      )}

      {(receiverSigned || providerSigned) && (
        <div className="mb-6 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Signatures
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className={cn(
                'rounded-[var(--radius-lg)] border border-dashed p-3',
                receiverSigned
                  ? 'border-[hsl(var(--color-success)/0.3)] bg-[hsl(var(--color-success)/0.03)]'
                  : 'border-[hsl(var(--color-border))]'
              )}
            >
              <p className="mb-1 text-[10px] text-[hsl(var(--color-text-3))]">
                Service Receiver
              </p>
              {receiverSigned ? (
                <>
                  <p className="text-lg font-serif italic text-[hsl(var(--color-text-1))]">
                    {contract.receiver_signature || 'Signed'}
                  </p>
                  <p className="mt-1 text-[10px] text-[hsl(var(--color-text-3))]">
                    Signed{' '}
                    {contract.receiver_signed_at
                      ? formatDate(contract.receiver_signed_at)
                      : formatDate(contract.updated_at)}
                  </p>
                </>
              ) : (
                <p className="text-xs italic text-[hsl(var(--color-text-3))]">
                  Awaiting signature
                </p>
              )}
            </div>

            <div
              className={cn(
                'rounded-[var(--radius-lg)] border border-dashed p-3',
                providerSigned
                  ? 'border-[hsl(var(--color-success)/0.3)] bg-[hsl(var(--color-success)/0.03)]'
                  : 'border-[hsl(var(--color-border))]'
              )}
            >
              <p className="mb-1 text-[10px] text-[hsl(var(--color-text-3))]">
                Service Provider
              </p>
              {providerSigned ? (
                <>
                  <p className="text-lg font-serif italic text-[hsl(var(--color-text-1))]">
                    {contract.provider_signature || 'Signed'}
                  </p>
                  <p className="mt-1 text-[10px] text-[hsl(var(--color-text-3))]">
                    Signed{' '}
                    {contract.provider_signed_at
                      ? formatDate(contract.provider_signed_at)
                      : formatDate(contract.updated_at)}
                  </p>
                </>
              ) : (
                <p className="text-xs italic text-[hsl(var(--color-text-3))]">
                  Awaiting signature
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {banner && (
        <ActionBanner
          variant={banner.variant}
          message={banner.message}
          cta={banner.cta}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <PartyCard
          role="initiator"
          user={contract.initiator ?? null}
          signedAt={contract.signed_initiator_at}
          isYou={isInitiator}
        />
        <PartyCard
          role="counterparty"
          user={contract.counterparty ?? null}
          signedAt={contract.signed_counterparty_at}
          isYou={isCounterparty}
          placeholder={contract.invite_token ? 'Invite sent' : 'Not invited yet'}
        />
      </div>

      <div className="mb-6">
        <EscrowBar
          milestones={milestones}
          currency={contract.currency}
          state={contract.state}
        />
      </div>

      <div className="mb-6">
        <MilestoneTracker
          milestones={milestones}
          currency={contract.currency}
          contractState={contract.state}
          isClient={isServiceReceiver}
          isVendor={isServiceProvider}
          onApprove={handleApprove}
          onDispute={handleDispute}
          onSubmit={handleSubmit}
        />
      </div>

      {contract.counterparty_id && (
        <div className="mb-6">
          <MessageThread
            contractId={contract.id}
            disabled={['cancelled', 'voided', 'expired'].includes(contract.state)}
          />
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
        <button
          type="button"
          onClick={() => setTermsOpen((value) => !value)}
          className={cn(
            'flex w-full items-center justify-between px-5 py-4 text-sm font-semibold',
            'text-[hsl(var(--color-text-1))] transition-colors duration-150',
            'hover:bg-[hsl(var(--color-surface-2)/0.5)]'
          )}
        >
          Contract terms
          <ChevronDown
            size={15}
            className={cn(
              'text-[hsl(var(--color-text-3))] transition-transform duration-200',
              termsOpen && 'rotate-180'
            )}
          />
        </button>
        {termsOpen && (
          <>
            <Separator />
            <div className="px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {contract.terms ?? 'No terms recorded.'}
              </p>
              <div className="mt-4 border-t border-[hsl(var(--color-border))] pt-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--color-text-3))]">
                  {contract.signed_initiator_at && (
                    <span>
                      Initiator signed {formatDateTime(contract.signed_initiator_at)}
                    </span>
                  )}
                  {contract.signed_counterparty_at && (
                    <span>
                      Counterparty signed{' '}
                      {formatDateTime(contract.signed_counterparty_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
          Contract details
        </h2>
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
          {[
            {
              label: 'Total value',
              value: formatCurrency(contract.total_value, contract.currency),
            },
            {
              label: 'Platform fee',
              value: contract.platform_fee
                ? `${formatCurrency(contract.platform_fee, contract.currency)} (${contract.platform_fee_pct}%)`
                : `${contract.platform_fee_pct}%`,
            },
            { label: 'Currency', value: contract.currency },
            { label: 'Industry', value: contract.industry },
            {
              label: 'Start date',
              value: contract.start_date ? formatDate(contract.start_date) : '-',
            },
            {
              label: 'End date',
              value: contract.end_date ? formatDate(contract.end_date) : '-',
            },
            {
              label: 'Created',
              value: formatDateTime(contract.created_at),
            },
            {
              label: 'Funded',
              value: contract.funded_at ? formatDateTime(contract.funded_at) : '-',
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                {label}
              </p>
              <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ActivityFeed contractId={contract.id} />

      <Modal
        open={shareModal}
        onOpenChange={setShareModal}
        title="Share invite link"
        description="Send this link to the counterparty to accept the contract."
        size="sm"
      >
        <div className="mt-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 overflow-hidden break-all font-mono text-xs leading-6 text-[hsl(var(--color-text-2))]">
            {inviteLink || 'No invite link available'}
            </p>
            <button
              type="button"
              onClick={copyInviteLink}
              className={cn(
                'inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium',
                'text-[hsl(var(--color-text-2))] transition-all duration-150',
                'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]',
                'sm:min-h-0 sm:w-auto sm:rounded-[var(--radius-sm)] sm:px-2 sm:py-1.5'
              )}
            >
              <Copy size={14} />
              <span className="sm:hidden">Copy link</span>
            </button>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => setShareModal(false)}>Done</Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={voidModal}
        onOpenChange={setVoidModal}
        title="Void this contract?"
        description="This action cannot be undone. The contract will be cancelled and archived. No funds will be moved."
        size="sm"
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setVoidModal(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleVoid}
          >
            Void contract
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function ActivityFeed({ contractId }: { contractId: string }) {
  const [items, setItems] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('audit_log')
        .select('*, actor:users!actor_id(full_name)')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(20)

      const nextItems = ((data ?? []) as unknown as Array<
        Record<string, unknown> & {
          actor?: { full_name: string } | { full_name: string }[] | null
        }
      >).map(normalizeActivityItem)

      setItems(nextItems)
      setLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`audit:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_log',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void load()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId])

  if (loading || items.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="mb-5 text-sm font-semibold text-[hsl(var(--color-text-1))]">
        Activity
      </h2>
      <div>
        {items.map((item, index) => (
          <ActivityItem
            key={item.id}
            event_type={item.event_type}
            payload={item.payload ?? {}}
            created_at={item.created_at}
            actor_name={item.actor?.full_name}
            last={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
