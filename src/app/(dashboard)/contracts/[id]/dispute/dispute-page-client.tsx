'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DeliverableCard } from '@/components/contracts/deliverable-card'
import { FileUpload, type UploadedFile } from '@/components/contracts/file-upload'
import { AiAnalysisCard } from '@/components/disputes/ai-analysis-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { AiDisputeAnalysis } from '@/lib/ai/types'
import {
  appealDispute,
  raiseDispute,
  submitEvidence,
} from '@/lib/disputes/actions'
import { useDispute, type DisputeWithEvidence } from '@/hooks/use-dispute'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDateTime, formatRelative } from '@/lib/utils/format-date'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronLeft,
  Minus,
  Scale,
  Shield,
  Timer,
  XCircle,
} from 'lucide-react'

const DISPUTE_REASONS = [
  ['non_delivery', 'Non-delivery', 'Work was not delivered or deliverables are missing.'],
  ['scope_mismatch', 'Scope mismatch', 'The delivery does not match the contract scope.'],
  ['quality', 'Quality issues', 'The delivery quality is below what was agreed.'],
  ['payment_delay', 'Payment not released', 'Payment has been withheld despite satisfactory delivery.'],
  ['other', 'Other', 'Another dispute reason not covered above.'],
] as const

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'danger' | 'warning' | 'accent' | 'success'; icon: React.ElementType }
> = {
  open: { label: 'Open', tone: 'danger', icon: AlertTriangle },
  awaiting_response: { label: 'Awaiting response', tone: 'warning', icon: Timer },
  under_review: { label: 'Under review', tone: 'warning', icon: Scale },
  clarification: { label: 'Clarification needed', tone: 'accent', icon: Scale },
  appealed: { label: 'Appealed', tone: 'accent', icon: Scale },
  resolved: { label: 'Resolved', tone: 'success', icon: CheckCircle },
}

type RaiseStep = 'reason' | 'description' | 'evidence' | 'confirm'

type ContractMilestone = {
  id: string
  title: string
  amount: number
  state: string
}

type ContractParty = {
  id: string
  full_name: string
  avatar_url: string | null
}

type DisputeContract = {
  id: string
  ref_code: string
  title: string
  currency: string
  initiator_id: string
  counterparty_id: string | null
  initiator: ContractParty | null
  counterparty: ContractParty | null
  milestones: ContractMilestone[]
}

type TimelineItem = {
  id: string
  title: string
  body: string
  at: string
  tone: 'danger' | 'warning' | 'accent' | 'success'
}

function toneClasses(tone: 'danger' | 'warning' | 'accent' | 'success') {
  return {
    danger:
      'border-[hsl(var(--color-danger)/0.2)] bg-[hsl(var(--color-danger)/0.08)] text-[hsl(var(--color-danger))]',
    warning:
      'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.08)] text-[hsl(var(--color-warning))]',
    accent:
      'border-[hsl(var(--color-accent)/0.2)] bg-[hsl(var(--color-accent)/0.08)] text-[hsl(var(--color-accent))]',
    success:
      'border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.08)] text-[hsl(var(--color-success))]',
  }[tone]
}

function reasonLabel(value: string | null | undefined) {
  return (
    DISPUTE_REASONS.find(([reason]) => reason === value)?.[1] ??
    value?.replaceAll('_', ' ') ??
    'Unknown'
  )
}

function ResponseCountdown({ responseDueAt }: { responseDueAt: string }) {
  const [remaining, setRemaining] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(responseDueAt).getTime() - Date.now()
      if (diff <= 0) {
        setUrgent(true)
        setRemaining('Response overdue')
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      setUrgent(diff < 6 * 3600000)
      setRemaining(`${hours}h ${minutes}m remaining to respond`)
    }

    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [responseDueAt])

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-3',
        urgent
          ? 'border-[hsl(var(--color-danger)/0.2)] bg-[hsl(var(--color-danger)/0.06)] text-[hsl(var(--color-danger))]'
          : 'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] text-[hsl(var(--color-warning))]'
      )}
    >
      <Timer size={14} />
      <span className="text-sm font-medium">{remaining}</span>
    </div>
  )
}

function EvidencePanel({
  title,
  user,
  evidence,
  disputeId,
  contractId,
  milestoneId,
  isOwn,
  canAdd,
  onAdded,
}: {
  title: string
  user: { full_name: string; avatar_url: string | null } | null
  evidence: Array<{
    id: string
    file_url: string | null
    file_name: string | null
    description: string | null
    created_at: string
  }>
  disputeId: string
  contractId: string
  milestoneId: string
  isOwn: boolean
  canAdd: boolean
  onAdded: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [statement, setStatement] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    if (files.length === 0 && !statement.trim()) {
      setError('Add at least one file or a written statement.')
      return
    }

    startTransition(async () => {
      const result = await submitEvidence(
        disputeId,
        files.map((file) => ({ path: file.path, name: file.name, description: '' })),
        statement
      )

      if (result.error) {
        setError(result.error)
        return
      }

      setAdding(false)
      setFiles([])
      setStatement('')
      toast.success('Evidence submitted.')
      onAdded()
    })
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--color-surface))]',
        isOwn ? 'border-[hsl(var(--color-accent)/0.25)]' : 'border-[hsl(var(--color-border))]'
      )}
    >
      <div className="flex items-center justify-between border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.5)] px-4 py-3">
        <div className="flex items-center gap-2">
          {user && <Avatar name={user.full_name} src={user.avatar_url} size="xs" />}
          <span className="text-xs font-semibold text-[hsl(var(--color-text-1))]">
            {title}
          </span>
          {isOwn && (
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent))]">
              You
            </span>
          )}
        </div>
        <span className="text-xs text-[hsl(var(--color-text-3))]">
          {evidence.length} item{evidence.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4">
        {evidence.length === 0 ? (
          <p className="py-4 text-center text-xs italic text-[hsl(var(--color-text-3))]">
            No evidence submitted yet.
          </p>
        ) : (
          <div className="mb-4 flex flex-col gap-3">
            {evidence.map((item) => (
              <div key={item.id}>
                <DeliverableCard
                  deliverable={{
                    id: item.id,
                    file_url: item.file_url,
                    file_name: item.file_name,
                    file_type: null,
                    note: item.description,
                    created_at: item.created_at,
                  }}
                />
                <p className="mt-1.5 text-[11px] text-[hsl(var(--color-text-3))]">
                  {formatRelative(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        {canAdd && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[hsl(var(--color-border-2))] text-xs text-[hsl(var(--color-text-3))] transition-all duration-150 hover:border-[hsl(var(--color-accent)/0.4)] hover:bg-[hsl(var(--color-accent)/0.04)] hover:text-[hsl(var(--color-text-2))]"
          >
            + Add evidence
          </button>
        )}

        {adding && (
          <div className="mt-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] p-3">
            <FileUpload
              contractId={contractId}
              milestoneId={milestoneId}
              onFilesChange={setFiles}
              maxFiles={3}
            />
            <textarea
              placeholder="Written statement (optional) - describe your position in detail..."
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-2.5 text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))]"
            />
            {error && <p className="mt-2 text-xs text-[hsl(var(--color-danger))]">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={isPending} onClick={handleSubmit}>
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RulingCard({
  dispute,
  currency,
  canAppeal,
  appealPending,
  onAppeal,
}: {
  dispute: DisputeWithEvidence
  currency: string
  canAppeal: boolean
  appealPending: boolean
  onAppeal: () => void
}) {
  const config =
    {
      vendor_wins: {
        icon: CheckCircle,
        tone: 'success' as const,
        label: 'Service provider wins - payment release initiated',
      },
      client_wins: {
        icon: XCircle,
        tone: 'danger' as const,
        label: 'Service receiver wins - milestone reset for re-delivery',
      },
      partial: {
        icon: Minus,
        tone: 'accent' as const,
        label: `Partial ruling - ${dispute.ruling_pct_vendor}% to service provider`,
      },
      cancelled: {
        icon: XCircle,
        tone: 'warning' as const,
        label: 'Dispute cancelled',
      },
    }[dispute.ruling as string] ?? {
      icon: Scale,
      tone: 'warning' as const,
      label: 'Ruling issued',
    }

  const Icon = config.icon
  const milestoneAmount = dispute.milestone?.amount ?? 0
  const vendorPct = dispute.ruling_pct_vendor ?? 0
  const vendorAmount = Math.round(milestoneAmount * (vendorPct / 100))
  const clientAmount = milestoneAmount - vendorAmount

  return (
    <div className={cn('rounded-[var(--radius-xl)] border p-5', toneClasses(config.tone))}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/40">
          <Icon size={20} />
        </div>
        <div>
          <p className="mb-0.5 text-xs text-[hsl(var(--color-text-3))]">
            Arbitration ruling
          </p>
          <p className="text-sm font-semibold">{config.label}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
        Arbitrator reasoning
      </p>
      <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
        {dispute.ruling_notes}
      </p>

      {dispute.ruling === 'partial' && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: `To service provider (${vendorPct}%)`, amount: vendorAmount },
              { label: `To service receiver (${100 - vendorPct}%)`, amount: clientAmount },
            ].map((entry) => (
              <div
                key={entry.label}
                className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-3"
              >
                <p className="mb-1 text-xs text-[hsl(var(--color-text-3))]">
                  {entry.label}
                </p>
                <p className="text-base font-semibold text-[hsl(var(--color-text-1))]">
                  {formatCurrency(entry.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {dispute.resolved_at && (
        <p className="mt-4 text-xs text-[hsl(var(--color-text-3))]">
          Resolved {formatDateTime(dispute.resolved_at)}
        </p>
      )}

      {canAppeal && (
        <div className="mt-4">
          <Button variant="secondary" loading={appealPending} onClick={onAppeal}>
            Request appeal
          </Button>
        </div>
      )}
    </div>
  )
}

function RaiseDisputeForm({
  contract,
  milestoneId,
}: {
  contract: DisputeContract
  milestoneId: string
}) {
  const [step, setStep] = useState<RaiseStep>('reason')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const milestone = contract.milestones.find((item) => item.id === milestoneId)
  const steps: RaiseStep[] = ['reason', 'description', 'evidence', 'confirm']
  const variants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  }

  function handleSubmit() {
    setError(null)

    if (!reason) {
      setError('Select a reason.')
      return
    }

    if (description.length < 100) {
      setError('Description must be at least 100 characters.')
      return
    }

    startTransition(async () => {
      const result = await raiseDispute(
        {
          contractId: contract.id,
          milestoneId,
          reason: reason as
            | 'scope_mismatch'
            | 'non_delivery'
            | 'quality'
            | 'payment_delay'
            | 'other',
          description,
        },
        files.map((file) => ({ path: file.path, name: file.name, description: '' }))
      )

      if (result.error) {
        setError(result.error)
        return
      }

      toast.success('Dispute opened. Funds are frozen.')

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        {steps.map((entry) => (
          <div
            key={entry}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              step === entry || steps.indexOf(step) > steps.indexOf(entry)
                ? 'bg-[hsl(var(--color-accent))]'
                : 'bg-[hsl(var(--color-border))]'
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'reason' && (
          <motion.div
            key="reason"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
              Why are you raising a dispute?
            </h2>
            <p className="mb-5 text-sm text-[hsl(var(--color-text-2))]">
              Select the reason that best describes the issue with{' '}
              <strong>{milestone?.title ?? 'this milestone'}</strong>.
            </p>
            <div className="mb-5 flex flex-col gap-2">
              {DISPUTE_REASONS.map(([value, label, text]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  className={cn(
                    'rounded-[var(--radius-lg)] border p-4 text-left transition-all duration-150 hover:border-[hsl(var(--color-border-2))]',
                    reason === value
                      ? 'border-[hsl(var(--color-accent)/0.5)] bg-[hsl(var(--color-accent)/0.05)]'
                      : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        reason === value
                          ? 'text-[hsl(var(--color-accent))]'
                          : 'text-[hsl(var(--color-text-1))]'
                      )}
                    >
                      {label}
                    </p>
                    {reason === value && (
                      <Check size={14} className="text-[hsl(var(--color-accent))]" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">{text}</p>
                </button>
              ))}
            </div>
            <Button
              disabled={!reason}
              onClick={() => setStep('description')}
              rightIcon={<ArrowRight size={15} />}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'description' && (
          <motion.div
            key="description"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
              Describe the issue
            </h2>
            <p className="mb-5 text-sm text-[hsl(var(--color-text-2))]">
              Be specific. The arbitrator will use this to understand your position.
            </p>
            <textarea
              placeholder="Describe exactly what went wrong, what was agreed, and what you expected to receive..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className="mb-2 w-full resize-y rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-2.5 text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]"
            />
            <div className="mb-5 text-xs text-[hsl(var(--color-text-3))]">
              {description.length}/100 minimum
            </div>
            {error && <p className="mb-3 text-xs text-[hsl(var(--color-danger))]">{error}</p>}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('reason')
                  setError(null)
                }}
              >
                Back
              </Button>
              <Button
                disabled={description.length < 100}
                onClick={() => {
                  setError(null)
                  setStep('evidence')
                }}
                rightIcon={<ArrowRight size={15} />}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'evidence' && (
          <motion.div
            key="evidence"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
              Upload supporting evidence
            </h2>
            <p className="mb-5 text-sm text-[hsl(var(--color-text-2))]">
              Attach any files that support your case. This is optional, but strong
              documentation makes the review easier to resolve fairly.
            </p>

            <FileUpload
              contractId={contract.id}
              milestoneId={milestoneId}
              onFilesChange={setFiles}
              maxFiles={5}
            />

            <div className="mt-5 flex gap-3">
              <Button variant="ghost" onClick={() => setStep('description')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                rightIcon={<ArrowRight size={15} />}
                className="flex-1"
              >
                {files.length > 0
                  ? `Continue with ${files.length} file${files.length === 1 ? '' : 's'}`
                  : 'Continue without files'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
              Review and submit
            </h2>
            <p className="mb-5 text-sm text-[hsl(var(--color-text-2))]">
              Once submitted, the milestone funds will be frozen and the other party
              will have 48 hours to respond.
            </p>

            <div className="mb-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
              {[
                { label: 'Milestone', value: milestone?.title ?? 'Unknown milestone' },
                { label: 'Reason', value: reasonLabel(reason) },
                {
                  label: 'Amount at stake',
                  value: formatCurrency(milestone?.amount ?? 0, contract.currency),
                },
                {
                  label: 'Evidence files',
                  value: `${files.length} file${files.length === 1 ? '' : 's'}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border-b border-[hsl(var(--color-border))] py-2.5 last:border-0"
                >
                  <span className="text-xs uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                    {item.label}
                  </span>
                  <span className="text-right text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-4">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
              />
              <div>
                <p className="mb-1 text-sm font-medium text-[hsl(var(--color-warning))]">
                  Dispute fee: $15.00
                </p>
                <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  A flat fee is collected before arbitration starts. This helps deter
                  bad-faith disputes and can be refunded during manual resolution.
                </p>
              </div>
            </div>

            {error && <p className="mb-3 text-xs text-[hsl(var(--color-danger))]">{error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('evidence')} disabled={isPending}>
                Back
              </Button>
              <Button
                variant="destructive"
                loading={isPending}
                onClick={handleSubmit}
                className="flex-1"
                leftIcon={<AlertTriangle size={15} />}
              >
                {isPending ? 'Opening dispute...' : 'Open dispute and pay $15'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DisputePageClient({
  contract,
  currentUserId,
  initialDispute,
  aiAnalysis,
  initialMilestoneId,
  feePaid,
}: {
  contract: DisputeContract
  currentUserId: string
  initialDispute: DisputeWithEvidence | null
  aiAnalysis?: AiDisputeAnalysis | null
  initialMilestoneId?: string
  feePaid: boolean
}) {
  const router = useRouter()
  const { dispute, refetch } = useDispute(contract.id, initialDispute)
  const [appealPending, startAppealTransition] = useTransition()

  const activeDispute = dispute ?? initialDispute
  const isInitiator = contract.initiator_id === currentUserId
  const isCounterparty = contract.counterparty_id === currentUserId

  useEffect(() => {
    if (!feePaid) {
      return
    }

    toast.success('Payment redirect complete. Fee verification will update automatically.')
    void refetch()
    router.replace(`/contracts/${contract.id}/dispute`)
  }, [contract.id, feePaid, refetch, router])

  const targetMilestoneId =
    initialMilestoneId ??
    activeDispute?.milestone_id ??
    contract.milestones.find((milestone) => milestone.state === 'submitted')?.id ??
    ''

  const targetMilestone =
    contract.milestones.find((milestone) => milestone.id === targetMilestoneId) ?? null

  const clientEvidence = useMemo(
    () =>
      (activeDispute?.evidence ?? []).filter(
        (item) => item.submitted_by === contract.initiator_id
      ),
    [activeDispute?.evidence, contract.initiator_id]
  )

  const vendorEvidence = useMemo(
    () =>
      (activeDispute?.evidence ?? []).filter(
        (item) => item.submitted_by === contract.counterparty_id
      ),
    [activeDispute?.evidence, contract.counterparty_id]
  )

  const respondentEvidence = useMemo(
    () =>
      (activeDispute?.evidence ?? []).filter(
        (item) => item.submitted_by === activeDispute?.respondent_id
      ),
    [activeDispute?.evidence, activeDispute?.respondent_id]
  )

  const canAddClientEvidence =
    Boolean(activeDispute) &&
    isInitiator &&
    ['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'].includes(
      activeDispute?.status ?? ''
    )

  const canAddVendorEvidence =
    Boolean(activeDispute) &&
    isCounterparty &&
    ['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'].includes(
      activeDispute?.status ?? ''
    )

  const showRaiseForm =
    !activeDispute &&
    Boolean(targetMilestoneId) &&
    targetMilestone?.state === 'submitted' &&
    (isInitiator || isCounterparty)

  const showResponseCountdown =
    Boolean(activeDispute?.response_due_at) &&
    ['open', 'awaiting_response'].includes(activeDispute?.status ?? '') &&
    respondentEvidence.length === 0

  const canRequestAiAnalysis =
    Boolean(activeDispute) &&
    (['under_review', 'clarification'].includes(activeDispute?.status ?? '') ||
      (clientEvidence.length > 0 && vendorEvidence.length > 0) ||
      (activeDispute?.status === 'awaiting_response' &&
        Boolean(activeDispute.response_due_at) &&
        new Date(activeDispute.response_due_at ?? '').getTime() < Date.now()))

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!activeDispute) {
      return []
    }

    const items: TimelineItem[] = [
      {
        id: `raised-${activeDispute.id}`,
        title: 'Dispute raised',
        body: `${activeDispute.raiser?.full_name ?? 'A contract party'} opened this dispute for ${reasonLabel(
          activeDispute.reason
        ).toLowerCase()}.`,
        at: activeDispute.raised_at,
        tone: 'danger',
      },
    ]

    if (activeDispute.dispute_fee_paid) {
      items.push({
        id: `fee-${activeDispute.id}`,
        title: 'Fee verified',
        body: 'The dispute filing fee was verified successfully.',
        at: activeDispute.raised_at,
        tone: 'warning',
      })
    }

    for (const evidence of activeDispute.evidence ?? []) {
      items.push({
        id: `evidence-${evidence.id}`,
        title: evidence.file_name ? 'Evidence uploaded' : 'Statement submitted',
        body: `${evidence.submitter?.full_name ?? 'A contract party'} submitted additional evidence.`,
        at: evidence.created_at,
        tone:
          evidence.submitted_by === activeDispute.respondent_id ? 'warning' : 'accent',
      })
    }

    if (activeDispute.status === 'resolved' && activeDispute.resolved_at) {
      items.push({
        id: `resolved-${activeDispute.id}`,
        title: 'Ruling issued',
        body: `Arbitration concluded with ${reasonLabel(activeDispute.ruling).toLowerCase()}.`,
        at: activeDispute.resolved_at,
        tone:
          activeDispute.ruling === 'vendor_wins'
            ? 'success'
            : activeDispute.ruling === 'partial'
              ? 'accent'
              : 'warning',
      })
    }

    return items.sort(
      (left, right) =>
        new Date(right.at).getTime() - new Date(left.at).getTime()
    )
  }, [activeDispute])

  function handleAppeal() {
    if (!activeDispute) {
      return
    }

    startAppealTransition(async () => {
      const result = await appealDispute(activeDispute.id)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Appeal requested. The dispute is back under review.')
      void refetch()
    })
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/contracts/${contract.id}`)}
          className="rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))] transition-all duration-150 hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--color-text-1))]">
            {activeDispute ? 'Dispute' : 'Raise a dispute'}
          </h1>
          <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
            {contract.ref_code} - {contract.title}
          </p>
        </div>
      </div>

      {activeDispute && (
        <div className="space-y-5">
          {(() => {
            const config = STATUS_CONFIG[activeDispute.status] ?? STATUS_CONFIG.open
            const Icon = config.icon
            return (
              <div
                className={cn(
                  'flex flex-col gap-4 rounded-[var(--radius-lg)] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                  toneClasses(config.tone)
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                      {activeDispute.milestone?.title ?? targetMilestone?.title ?? 'Milestone'}
                      {' '} - {reasonLabel(activeDispute.reason)}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                      Raised {formatRelative(activeDispute.raised_at)}
                      {activeDispute.dispute_fee_paid ? ' - fee verified' : ' - fee pending'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">At stake</p>
                  <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    {formatCurrency(activeDispute.milestone?.amount ?? 0, contract.currency)}
                  </p>
                </div>
              </div>
            )
          })()}

          {showResponseCountdown && activeDispute.response_due_at && (
            <ResponseCountdown responseDueAt={activeDispute.response_due_at} />
          )}

          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
              Issue description
            </p>
            <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
              {activeDispute.description}
            </p>
          </div>

          {activeDispute.status !== 'resolved' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <EvidencePanel
                title="Service Receiver's case"
                user={contract.initiator}
                evidence={clientEvidence}
                disputeId={activeDispute.id}
                contractId={contract.id}
                milestoneId={targetMilestoneId}
                isOwn={isInitiator}
                canAdd={canAddClientEvidence}
                onAdded={() => {
                  void refetch()
                }}
              />
              <EvidencePanel
                title="Service Provider's response"
                user={contract.counterparty}
                evidence={vendorEvidence}
                disputeId={activeDispute.id}
                contractId={contract.id}
                milestoneId={targetMilestoneId}
                isOwn={isCounterparty}
                canAdd={canAddVendorEvidence}
                onAdded={() => {
                  void refetch()
                }}
              />
            </div>
          )}

          {activeDispute &&
            ['open', 'awaiting_response', 'under_review', 'clarification'].includes(
              activeDispute.status
            ) && (
              <AiAnalysisCard
                disputeId={activeDispute.id}
                milestoneAmount={
                  activeDispute.milestone?.amount ?? targetMilestone?.amount ?? 0
                }
                currency={contract.currency}
                initialAnalysis={aiAnalysis ?? null}
                canRequest={canRequestAiAnalysis}
              />
            )}

          {['under_review', 'clarification', 'appealed'].includes(activeDispute.status) && (
            <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-4">
              <Scale
                size={15}
                className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
              />
              <div>
                <p className="mb-1 text-sm font-medium text-[hsl(var(--color-warning))]">
                  Arbitration in progress
                </p>
                <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  A Contrakts arbitrator is reviewing the evidence from both
                  parties. Keep all further submissions inside this record so the
                  ruling remains complete and auditable.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
            <p className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Timeline
            </p>
            {timelineItems.length === 0 ? (
              <p className="text-sm text-[hsl(var(--color-text-3))]">
                No dispute activity recorded yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {timelineItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                          {item.body}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-[hsl(var(--color-text-3))]">
                        {formatRelative(item.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeDispute.status === 'resolved' && (
            <RulingCard
              dispute={activeDispute}
              currency={contract.currency}
              canAppeal={isInitiator || isCounterparty}
              appealPending={appealPending}
              onAppeal={handleAppeal}
            />
          )}
        </div>
      )}

      {showRaiseForm && targetMilestoneId && (
        <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
          <RaiseDisputeForm contract={contract} milestoneId={targetMilestoneId} />
        </div>
      )}

      {!activeDispute && !showRaiseForm && (
        <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-6 py-16 text-center">
          <Shield size={28} className="mb-4 text-[hsl(var(--color-text-3))]" />
          <p className="mb-2 text-sm font-medium text-[hsl(var(--color-text-1))]">
            No disputes
          </p>
          <p className="max-w-xs text-xs text-[hsl(var(--color-text-3))]">
            Disputes can only be opened against submitted milestones. There is no
            milestone currently eligible for arbitration.
          </p>
        </div>
      )}
    </div>
  )
}
