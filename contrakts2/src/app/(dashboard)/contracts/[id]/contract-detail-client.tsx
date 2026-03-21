'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  Copy,
  DollarSign,
  ExternalLink,
  Layers,
  MoreHorizontal,
  Share2,
  Trash2,
} from 'lucide-react'
import { ActionBanner } from '@/components/contracts/action-banner'
import { MilestoneTracker } from '@/components/contracts/milestone-tracker'
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
import { voidContract, signContract } from '@/lib/contracts/actions'
import { saveContractAsTemplate } from '@/lib/templates/actions'
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

const STATE_HEADER_ACCENT: Record<string, string> = {
  active: 'border-l-[hsl(var(--color-success)/0.5)]',
  pending: 'border-l-[hsl(var(--color-accent)/0.5)]',
  funded: 'border-l-[hsl(var(--color-success)/0.5)]',
  in_review: 'border-l-[hsl(var(--color-warning)/0.5)]',
  disputed: 'border-l-[hsl(var(--color-danger)/0.5)]',
  complete: 'border-l-[hsl(var(--color-success)/0.5)]',
  voided: 'border-l-[hsl(var(--color-text-3)/0.3)]',
  draft: 'border-l-[hsl(var(--color-text-3)/0.3)]',
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
  const isClient = isInitiator
  const isVendor = isCounterparty

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
    if (contract.state === 'pending') {
      if (isCounterparty && !contract.signed_counterparty_at) {
        return {
          variant: 'accent',
          message:
            "You've been invited to this contract. Review the terms and sign to proceed.",
          cta: {
            label: 'Sign contract',
            loading: isPending,
            onClick: () =>
              startTransition(async () => {
                const result = await signContract(contract.id)
                if (result.error) {
                  toast.error(result.error)
                  return
                }
                toast.success(
                  'Contract signed. Waiting for escrow to be funded.'
                )
              }),
          },
        }
      }

      if (isInitiator && !contract.signed_initiator_at) {
        return {
          variant: 'accent',
          message: 'Sign this contract to confirm you agree to the terms.',
          cta: {
            label: 'Sign contract',
            loading: isPending,
            onClick: () =>
              startTransition(async () => {
                const result = await signContract(contract.id)
                if (result.error) {
                  toast.error(result.error)
                  return
                }
                toast.success('Signed. Waiting for counterparty.')
              }),
          },
        }
      }

      if (
        isInitiator &&
        contract.signed_initiator_at &&
        !contract.signed_counterparty_at
      ) {
        return {
          variant: 'neutral',
          message:
            'Waiting for the counterparty to sign. Share the invite link if needed.',
          cta: {
            label: 'Share invite',
            onClick: () => setShareModal(true),
          },
        }
      }

      if (
        isInitiator &&
        contract.signed_initiator_at &&
        contract.signed_counterparty_at
      ) {
        return {
          variant: 'success',
          message: 'Both parties have signed. Fund the escrow to begin work.',
          cta: {
            label: 'Fund escrow',
            onClick: () => router.push(`/contracts/${contract.id}/fund`),
          },
        }
      }
    }

    if (['funded', 'active'].includes(contract.state) && isVendor) {
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

    if (contract.state === 'in_review' && isClient) {
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

  return (
    <div className="mx-auto max-w-[800px]">
      {/* Header section with state-colored left accent */}
      <div
        className={cn(
          'mb-6 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] border-l-[3px] bg-[hsl(var(--color-surface))] p-6',
          STATE_HEADER_ACCENT[contract.state]
        )}
      >
        <Link
          href="/contracts"
          className={cn(
            'group mb-4 inline-flex items-center gap-1.5 text-xs',
            'text-[hsl(var(--color-text-3))] transition-colors duration-200',
            'hover:text-[hsl(var(--color-accent))]'
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Contracts
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1.5 font-mono text-[11px] tracking-wider text-[hsl(var(--color-text-3))] uppercase">
              {contract.ref_code}
            </p>
            <h1 className="text-2xl font-bold leading-tight text-[hsl(var(--color-text-1))]">
              {contract.title}
            </h1>
            {contract.description && (
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {contract.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ContractStateBadge state={contract.state} />
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                Created {formatDate(contract.created_at)}
              </span>
              {contract.end_date && (
                <>
                  <span className="text-2xs text-[hsl(var(--color-border-2))]">
                    &middot;
                  </span>
                  <span className="text-xs text-[hsl(var(--color-text-3))]">
                    Due {formatDate(contract.end_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Share2 size={13} />}
              onClick={() => setShareModal(true)}
            >
              Share
            </Button>
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon">
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

      {banner && (
        <ActionBanner
          variant={banner.variant}
          message={banner.message}
          cta={banner.cta}
        />
      )}

      {/* Parties */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
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

      {/* Escrow */}
      <div className="mb-6">
        <EscrowBar
          milestones={milestones}
          currency={contract.currency}
          state={contract.state}
        />
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <MilestoneTracker
          milestones={milestones}
          currency={contract.currency}
          contractState={contract.state}
          isClient={isClient}
          isVendor={isVendor}
          onApprove={handleApprove}
          onDispute={handleDispute}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Terms accordion with enhanced styling */}
      <div className="mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] transition-shadow duration-200 hover:shadow-card">
        <button
          type="button"
          onClick={() => setTermsOpen((value) => !value)}
          className={cn(
            'flex w-full items-center justify-between px-5 py-4 text-sm font-semibold',
            'text-[hsl(var(--color-text-1))] transition-colors duration-200',
            'hover:bg-[hsl(var(--color-surface-2)/0.5)]'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))]">
              <ExternalLink size={13} className="text-[hsl(var(--color-text-2))]" />
            </div>
            Contract terms
          </div>
          <ChevronDown
            size={15}
            className={cn(
              'text-[hsl(var(--color-text-3))] transition-transform duration-300',
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
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[hsl(var(--color-success))]" />
                      Initiator signed {formatDateTime(contract.signed_initiator_at)}
                    </span>
                  )}
                  {contract.signed_counterparty_at && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[hsl(var(--color-success))]" />
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

      {/* Contract details with enhanced grid */}
      <div className="mb-6 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 transition-shadow duration-200 hover:shadow-card">
        <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-[hsl(var(--color-text-1))]">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))]">
            <DollarSign size={13} className="text-[hsl(var(--color-text-2))]" />
          </div>
          Contract details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              label: 'Total value',
              value: formatCurrency(contract.total_value, contract.currency),
              highlight: true,
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
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={cn(
                'rounded-[var(--radius-md)] border border-[hsl(var(--color-border)/0.5)] bg-[hsl(var(--color-surface-2)/0.3)] p-3',
                highlight && 'border-[hsl(var(--color-accent)/0.2)] bg-[hsl(var(--color-accent)/0.03)]'
              )}
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--color-text-3))]">
                {label}
              </p>
              <p
                className={cn(
                  'text-sm font-medium text-[hsl(var(--color-text-1))]',
                  highlight && 'font-semibold'
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed contractId={contract.id} />

      {/* Share modal */}
      <Modal
        open={shareModal}
        onOpenChange={setShareModal}
        title="Share invite link"
        description="Send this link to the counterparty to accept the contract."
        size="sm"
      >
        <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
          <p className="flex-1 truncate font-mono text-xs text-[hsl(var(--color-text-2))]">
            {inviteLink || 'No invite link available'}
          </p>
          <button
            type="button"
            onClick={copyInviteLink}
            className={cn(
              'shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))]',
              'transition-all duration-200',
              'hover:bg-[hsl(var(--color-surface-3))] hover:text-[hsl(var(--color-accent))]'
            )}
          >
            <Copy size={14} />
          </button>
        </div>
        <ModalFooter>
          <Button onClick={() => setShareModal(false)}>Done</Button>
        </ModalFooter>
      </Modal>

      {/* Void modal */}
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
    <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 transition-shadow duration-200 hover:shadow-card">
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
