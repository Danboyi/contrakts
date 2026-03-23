'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  FileText,
  PenTool,
  Shield,
} from 'lucide-react'
import { ROLE_LABELS, type PartyRole } from '@/lib/types/negotiation'
import { signContract } from '@/lib/contracts/signing-actions'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Contract, Milestone, User } from '@/types'

interface SigningFlowProps {
  contract: Contract
  milestones: Milestone[]
  currentUser: Pick<User, 'id' | 'full_name' | 'email'> | null
  otherParty: Pick<User, 'id' | 'full_name' | 'email'> | null
  userRole: PartyRole
}

export function SigningFlow({
  contract,
  milestones,
  currentUser,
  otherParty,
  userRole,
}: SigningFlowProps) {
  const router = useRouter()
  const [signature, setSignature] = useState(currentUser?.full_name ?? '')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToEscrow, setAgreedToEscrow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'review' | 'sign'>('review')
  const [error, setError] = useState<string | null>(null)

  const isReceiver = userRole === 'service_receiver'
  const otherPartyName = otherParty?.full_name || otherParty?.email || 'the other party'
  const canSign =
    signature.trim().length >= 2 && agreedToTerms && agreedToEscrow && !isSubmitting

  async function handleSign() {
    if (!currentUser || !canSign) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await signContract({
        contractId: contract.id,
        userId: currentUser.id,
        userRole,
        signature: signature.trim(),
      })
      router.push(`/contracts/${contract.id}`)
      router.refresh()
    } catch (signError) {
      setError(
        signError instanceof Error
          ? signError.message
          : 'Failed to sign contract. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
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

      <div className="mb-6">
        <h1 className="mb-2 text-xl font-semibold text-[hsl(var(--color-text-1))] sm:text-2xl">
          Sign Contract
        </h1>
        <p className="text-sm text-[hsl(var(--color-text-2))]">
          Review the agreed terms and sign to
          {isReceiver
            ? ' confirm you will fund the escrow.'
            : ' confirm you will deliver the agreed work.'}
        </p>
      </div>

      {step === 'review' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[hsl(var(--color-accent))]" />
              <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Agreed Terms
              </h2>
              <span
                className={cn(
                  'ml-auto rounded-full bg-[hsl(var(--color-success)/0.1)] px-2 py-0.5 text-[10px] font-medium',
                  'text-[hsl(var(--color-success))]'
                )}
              >
                Terms locked
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <DetailRow label="Title" value={contract.title} />
              <DetailRow
                label="Total Value"
                value={formatCurrency(contract.total_value, contract.currency)}
                highlight
              />
              <DetailRow label="Your Role" value={ROLE_LABELS[userRole]} />
              <DetailRow
                label={isReceiver ? 'Service Provider' : 'Service Receiver'}
                value={otherPartyName}
              />
              {contract.start_date && (
                <DetailRow label="Start Date" value={contract.start_date} />
              )}
              {contract.end_date && (
                <DetailRow label="End Date" value={contract.end_date} />
              )}
            </div>

            {contract.description && (
              <div className="mt-4 border-t border-[hsl(var(--color-border))] pt-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  {contract.description}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Milestones ({milestones.length})
            </h2>

            <div className="flex flex-col gap-2">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className={cn(
                    'flex items-center gap-3 border-b border-[hsl(var(--color-border))] py-2.5',
                    'last:border-0'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                      'bg-[hsl(var(--color-surface-2))] text-[10px] font-bold text-[hsl(var(--color-text-3))]'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[hsl(var(--color-text-1))]">
                      {milestone.title}
                    </p>
                    {milestone.deadline && (
                      <p className="text-[10px] text-[hsl(var(--color-text-3))]">
                        Due: {milestone.deadline}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    {formatCurrency(milestone.amount, contract.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--color-border))] pt-3">
              <span className="text-xs font-semibold text-[hsl(var(--color-text-1))]">
                Total
              </span>
              <span className="text-base font-bold text-[hsl(var(--color-text-1))]">
                {formatCurrency(contract.total_value, contract.currency)}
              </span>
            </div>
          </div>

          <div
            className={cn(
              'rounded-[var(--radius-lg)] border border-[hsl(var(--color-accent)/0.12)]',
              'bg-[hsl(var(--color-accent)/0.04)] p-4'
            )}
          >
            <div className="flex items-start gap-3">
              <Shield
                size={16}
                className="mt-0.5 flex-shrink-0 text-[hsl(var(--color-accent))]"
              />
              <div>
                <p className="mb-2 text-sm font-medium text-[hsl(var(--color-text-1))]">
                  By signing, you agree to:
                </p>
                <div className="flex flex-col gap-1.5">
                  {isReceiver ? (
                    <>
                      <BulletPoint text="Fund the full escrow amount after both signatures are complete" />
                      <BulletPoint text="Review and approve each milestone delivery within 72 hours" />
                      <BulletPoint text="Payments auto-release if no review happens within 72 hours" />
                      <BulletPoint text="Disputes are handled through Contrakts arbitration" />
                    </>
                  ) : (
                    <>
                      <BulletPoint text="Deliver each milestone exactly as agreed in the locked terms" />
                      <BulletPoint text="Submit milestone deliverables through Contrakts for review" />
                      <BulletPoint text="Receive payment only after approval or timed auto-release" />
                      <BulletPoint text="Disputes are handled through Contrakts arbitration" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('sign')}
            className={cn(
              'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6 py-3.5',
              'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
              'transition-all duration-200 hover:brightness-110 active:scale-[0.98]'
            )}
          >
            <PenTool size={16} />
            Proceed to Sign
          </button>
        </div>
      )}

      {step === 'sign' && (
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setStep('review')}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm',
              'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-1))]'
            )}
          >
            <ArrowLeft size={14} />
            Back to review
          </button>

          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 sm:p-6">
            <h2 className="mb-1 text-base font-semibold text-[hsl(var(--color-text-1))]">
              Your Signature
            </h2>
            <p className="mb-5 text-xs text-[hsl(var(--color-text-2))]">
              Type your full legal name as your electronic signature. This is
              legally binding.
            </p>

            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                Full legal name
              </label>
              <input
                value={signature}
                onChange={(event) => setSignature(event.target.value)}
                placeholder={currentUser?.full_name || 'Your full name'}
                autoFocus
                className={cn(
                  'min-h-[52px] w-full rounded-[var(--radius-md)] border-2 border-[hsl(var(--color-border))]',
                  'bg-[hsl(var(--color-bg))] px-4 py-3 text-lg font-serif italic text-[hsl(var(--color-text-1))]',
                  'transition-all duration-200 focus:border-[hsl(var(--color-accent))] focus:outline-none'
                )}
              />
            </div>

            {signature.trim().length >= 2 && (
              <div
                className={cn(
                  'mb-5 rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--color-border))]',
                  'bg-[hsl(var(--color-bg))] p-4'
                )}
              >
                <p className="mb-2 text-[10px] text-[hsl(var(--color-text-3))]">
                  Signature preview
                </p>
                <p className="select-none text-2xl font-serif italic text-[hsl(var(--color-text-1))] sm:text-3xl">
                  {signature.trim()}
                </p>
                <p className="mt-2 text-[10px] text-[hsl(var(--color-text-3))]">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  • {ROLE_LABELS[userRole]}
                </p>
              </div>
            )}

            <div className="mb-6 flex flex-col gap-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[hsl(var(--color-border))] accent-[hsl(var(--color-accent))]"
                />
                <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  I have reviewed and agree to all locked terms, milestones,
                  amounts, and deadlines. I understand this is a legally
                  binding agreement.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToEscrow}
                  onChange={(event) => setAgreedToEscrow(event.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[hsl(var(--color-border))] accent-[hsl(var(--color-accent))]"
                />
                <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  {isReceiver
                    ? 'I agree to fund the escrow after both signatures are complete and understand milestone payments release after approval or timed auto-release.'
                    : 'I agree to deliver the work as specified and understand payment stays in escrow until milestone approval or timed auto-release.'}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSign}
              disabled={!canSign}
              className={cn(
                'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6 py-3.5 text-sm font-semibold',
                'transition-all duration-200',
                canSign
                  ? 'bg-[hsl(var(--color-success))] text-white shadow-[0_4px_16px_hsl(var(--color-success)/0.3)] hover:brightness-110 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
              )}
            >
              {isSubmitting ? (
                <span>Signing...</span>
              ) : (
                <>
                  <PenTool size={16} />
                  Sign Contract
                </>
              )}
            </button>

            {!canSign && !error && (
              <p className="mt-3 text-center text-[10px] text-[hsl(var(--color-text-3))]">
                Enter your name and accept both statements to sign.
              </p>
            )}

            {error && (
              <div
                className={cn(
                  'mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.25)]',
                  'bg-[hsl(var(--color-danger)/0.08)] px-3 py-2'
                )}
              >
                <AlertTriangle
                  size={14}
                  className="mt-0.5 flex-shrink-0 text-[hsl(var(--color-danger))]"
                />
                <p className="text-xs leading-relaxed text-[hsl(var(--color-danger))]">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b border-[hsl(var(--color-border))] py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <span className="text-xs text-[hsl(var(--color-text-3))]">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          highlight
            ? 'font-semibold text-[hsl(var(--color-success))]'
            : 'text-[hsl(var(--color-text-1))]'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function BulletPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle
        size={12}
        className="mt-0.5 flex-shrink-0 text-[hsl(var(--color-accent))]"
      />
      <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
        {text}
      </span>
    </div>
  )
}
