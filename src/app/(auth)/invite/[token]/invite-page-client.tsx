'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useTransition } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  FileText,
  Loader2,
  Shield,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { TrustScore } from '@/components/ui/trust-score'
import { signAsExistingUser, signAsNewUser } from '@/lib/contracts/signature-actions'
import { ROLE_LABELS, getCounterpartyRole } from '@/lib/types/negotiation'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Milestone, User } from '@/types'

type Phase = 'preview' | 'new_user' | 'existing_user' | 'success'

type AuthenticatedInviteUser = Pick<User, 'id' | 'full_name' | 'email'>

type InviteContract = {
  id: string
  ref_code: string
  title: string
  description: string | null
  industry: string
  total_value: number
  currency: string
  state: string
  terms: string | null
  created_at: string
  start_date: string | null
  end_date: string | null
  initiator_role: 'service_provider' | 'service_receiver'
  invite_token: string | null
  initiator: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'trust_score' | 'kyc_status'> | null
  milestones: Array<
    Pick<Milestone, 'id' | 'order_index' | 'title' | 'description' | 'amount' | 'deadline'>
  >
}

const INDUSTRY_LABELS: Record<string, string> = {
  creative: 'Creative & Design',
  construction: 'Construction',
  consulting: 'Consulting',
  logistics: 'Logistics',
  software: 'Software & Tech',
  events: 'Events',
  supply: 'Supply Chain',
  other: 'Services',
}

const panelCls = cn(
  'w-full rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
  'bg-[hsl(var(--color-surface))] shadow-[0_24px_80px_hsl(0_0%_0%/0.18)]'
)

const inputCls = cn(
  'h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
  'bg-[hsl(var(--color-surface-2))] px-4 text-sm text-[hsl(var(--color-text-1))]',
  'placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
  'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
)

function Wordmark() {
  return (
    <div className="absolute left-8 top-6">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-[hsl(var(--color-text-1))]">
        <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--color-accent))]" />
        Contrakts
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--color-text-3))]">
      {children}
    </p>
  )
}

function ContractPreviewPhase({
  contract,
  currentUser,
  onNewUser,
  onExistingUser,
  onAcceptDirectly,
}: {
  contract: InviteContract
  currentUser: AuthenticatedInviteUser | null
  onNewUser: () => void
  onExistingUser: () => void
  onAcceptDirectly: () => void
}) {
  const [termsExpanded, setTermsExpanded] = useState(false)
  const inviteeRole = getCounterpartyRole(contract.initiator_role)

  return (
    <div className="w-full max-w-[640px]">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-accent)/0.25)] bg-[hsl(var(--color-accent)/0.1)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-accent))]">
        <FileText size={12} />
        Contract invite
      </div>

      <h1 className="mb-2 text-[28px] font-semibold leading-tight text-[hsl(var(--color-text-1))]">
        {contract.title}
      </h1>
      <p className="mb-6 font-mono text-[12px] tracking-[0.08em] text-[hsl(var(--color-text-3))]">
        {contract.ref_code}
      </p>

      <div className={panelCls}>
        <div className="flex flex-col gap-4 border-b border-[hsl(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={contract.initiator?.full_name ?? 'Unknown'}
              src={contract.initiator?.avatar_url}
              size="md"
              verified={contract.initiator?.kyc_status === 'verified'}
            />
            <div>
              <p className="mb-1 text-[11px] text-[hsl(var(--color-text-3))]">
                Invited by
              </p>
              <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                {contract.initiator?.full_name ?? 'Unknown'}
              </p>
            </div>
          </div>
          <TrustScore score={contract.initiator?.trust_score ?? 100} size="md" showLabel />
        </div>

        <div className="border-b border-[hsl(var(--color-border))] px-6 py-5">
          <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-accent)/0.15)] bg-[hsl(var(--color-accent)/0.06)] px-3 py-2">
            <span className="text-xs font-medium text-[hsl(var(--color-accent))]">
              You are invited as the {ROLE_LABELS[inviteeRole]}
            </span>
          </div>

          <p className="mb-4 text-sm text-[hsl(var(--color-text-2))]">
            <span className="font-medium text-[hsl(var(--color-text-1))]">
              {contract.initiator?.full_name ?? 'The initiator'}
            </span>{' '}
            {contract.initiator_role === 'service_provider'
              ? 'is offering their services and sent you this contract for review.'
              : 'needs your services and sent you this contract for review.'}
          </p>

          {contract.description && (
            <p className="mb-4 text-sm leading-7 text-[hsl(var(--color-text-2))]">
              {contract.description}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Industry',
                value: INDUSTRY_LABELS[contract.industry] ?? contract.industry,
              },
              {
                label: 'Total value',
                value: formatCurrency(contract.total_value, contract.currency),
              },
              ...(contract.start_date
                ? [{ label: 'Start', value: contract.start_date }]
                : []),
              ...(contract.end_date
                ? [{ label: 'End', value: contract.end_date }]
                : []),
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3"
              >
                <p className="mb-1 text-[11px] text-[hsl(var(--color-text-3))]">
                  {label}
                </p>
                <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-[hsl(var(--color-border))] px-6 py-5">
          <SectionLabel>
            Milestones ({contract.milestones.length})
          </SectionLabel>

          <div className="flex flex-col gap-3">
            {contract.milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface-2))] text-[10px] font-semibold text-[hsl(var(--color-text-3))]">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm text-[hsl(var(--color-text-2))]">
                    {milestone.title}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium text-[hsl(var(--color-text-1))]">
                  {formatCurrency(milestone.amount, contract.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {contract.terms && (
          <div className="border-b border-[hsl(var(--color-border))]">
            <button
              type="button"
              onClick={() => setTermsExpanded((value) => !value)}
              className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-[hsl(var(--color-text-2))] transition-colors duration-150 hover:bg-[hsl(var(--color-surface-2)/0.5)]"
            >
              View contract terms
              <ChevronDown
                size={14}
                className={cn(
                  'text-[hsl(var(--color-text-3))] transition-transform duration-200',
                  termsExpanded && 'rotate-180'
                )}
              />
            </button>

            {termsExpanded && (
              <div className="px-6 pb-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[hsl(var(--color-text-2))]">
                  {contract.terms}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 bg-[hsl(var(--color-success)/0.05)] px-6 py-4">
          <Shield size={15} className="mt-0.5 shrink-0 text-[hsl(var(--color-success))]" />
          <p className="text-xs leading-6 text-[hsl(var(--color-text-2))]">
            This contract is protected by Contrakts escrow. Payment is held securely and
            only released when you approve each milestone. Disputes are arbitrated by
            Contrakts.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {currentUser ? (
          <button
            type="button"
            onClick={onAcceptDirectly}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)]',
              'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
              'transition-transform duration-150 hover:-translate-y-0.5'
            )}
          >
            Review as {currentUser.full_name}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onNewUser}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)]',
                'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
                'transition-transform duration-150 hover:-translate-y-0.5'
              )}
            >
              Create account & review
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={onExistingUser}
              className={cn(
                'mt-3 h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
                'text-sm font-medium text-[hsl(var(--color-text-2))] transition-colors duration-150',
                'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              Sign in to review
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-[11px] leading-6 text-[hsl(var(--color-text-3))]">
        By continuing you agree to review the contract terms above and the{' '}
        <a
          href="#"
          className="text-[hsl(var(--color-text-2))] transition-colors duration-150 hover:text-[hsl(var(--color-text-1))]"
        >
          Contrakts escrow agreement
        </a>
        .
      </p>
    </div>
  )
}

function AuthBackButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-2 text-sm text-[hsl(var(--color-text-3))] transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  )
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-3 text-sm text-[hsl(var(--color-danger))]">
      {error}
    </div>
  )
}

function NewUserPhase({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (payload: { name: string; email: string; password: string }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim() || name.trim().length < 2) {
      setError('Enter your full name.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    onComplete({
      name: name.trim(),
      email: email.trim(),
      password,
    })
  }

  return (
    <div className="w-full max-w-[420px]">
      <AuthBackButton label="Back to contract" onClick={onBack} />

      <h2 className="mb-2 text-[24px] font-semibold text-[hsl(var(--color-text-1))]">
        Create your account
      </h2>
      <p className="mb-7 text-sm text-[hsl(var(--color-text-2))]">
        You&apos;ll use this account to review and negotiate this contract.
      </p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputCls}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputCls}
        />

        <ErrorBox error={error} />

        <button
          type="submit"
          className={cn(
            'mt-2 flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)]',
            'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
            'transition-transform duration-150 hover:-translate-y-0.5'
          )}
        >
          Continue to contract
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
  )
}

function ExistingUserPhase({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (payload: { email: string; password: string }) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (!password) {
      setError('Enter your password.')
      return
    }

    onComplete({
      email: email.trim(),
      password,
    })
  }

  return (
    <div className="w-full max-w-[420px]">
      <AuthBackButton label="Back to contract" onClick={onBack} />

      <h2 className="mb-2 text-[24px] font-semibold text-[hsl(var(--color-text-1))]">
        Sign in to continue
      </h2>
      <p className="mb-7 text-sm text-[hsl(var(--color-text-2))]">
        Sign in to your Contrakts account to review this contract.
      </p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputCls}
        />

        <ErrorBox error={error} />

        <button
          type="submit"
          className={cn(
            'mt-2 flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)]',
            'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
            'transition-transform duration-150 hover:-translate-y-0.5'
          )}
        >
          Continue to contract
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
  )
}

function SuccessPhase({
  contractId,
  contractTitle,
}: {
  contractId: string
  contractTitle: string
}) {
  const router = useRouter()

  return (
    <div className="w-full max-w-[480px] text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]"
      >
        <CheckCircle size={32} className="text-[hsl(var(--color-success))]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.22 }}
      >
        <h2 className="mb-3 text-[26px] font-semibold text-[hsl(var(--color-text-1))]">
          Invite accepted
        </h2>
        <p className="mb-2 text-sm leading-7 text-[hsl(var(--color-text-2))]">
          You&apos;ve joined{' '}
          <strong className="font-semibold text-[hsl(var(--color-text-1))]">
            {contractTitle}
          </strong>
          .
        </p>
        <p className="mb-8 text-sm leading-7 text-[hsl(var(--color-text-3))]">
          The initiator has been notified. You can now review the terms,
          negotiate changes, and continue the contract flow inside Contrakts.
        </p>

        <button
          type="button"
          onClick={() => router.push(`/contracts/${contractId}/review`)}
          className={cn(
            'flex h-12 w-full items-center justify-center rounded-[var(--radius-md)]',
            'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
            'transition-transform duration-150 hover:-translate-y-0.5'
          )}
        >
          Review contract
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className={cn(
            'mt-3 h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'text-sm font-medium text-[hsl(var(--color-text-3))] transition-colors duration-150',
            'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
          )}
        >
          Go to dashboard
        </button>
      </motion.div>
    </div>
  )
}

export function InvitePageClient({
  contract,
  token,
  currentUser,
}: {
  contract: InviteContract
  token: string
  currentUser: User | null
}) {
  const [phase, setPhase] = useState<Phase>('preview')
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedInviteUser | null>(
      currentUser
        ? {
            id: currentUser.id,
            full_name: currentUser.full_name,
            email: currentUser.email,
          }
        : null
    )
  const [contractId, setContractId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAccept(params: {
    mode: 'current_user' | 'existing_user' | 'new_user'
    email?: string
    password?: string
    name?: string
  }) {
    setActionError(null)

    startTransition(async () => {
      let result:
        | Awaited<ReturnType<typeof signAsExistingUser>>
        | Awaited<ReturnType<typeof signAsNewUser>>
        | null = null

      if (params.mode === 'current_user' && authenticatedUser) {
        result = await signAsExistingUser({
          token,
          email: authenticatedUser.email,
          password: undefined,
        })
      } else if (params.mode === 'existing_user' && params.email) {
        result = await signAsExistingUser({
          token,
          email: params.email,
          password: params.password,
        })
      } else if (params.mode === 'new_user' && params.name && params.email && params.password) {
        result = await signAsNewUser({
          token,
          full_name: params.name,
          email: params.email,
          password: params.password,
        })
      }

      if (!result) {
        setActionError('Unable to continue with this invite.')
        return
      }

      if (result.error) {
        setActionError(result.error)
        return
      }

      setContractId(result.contractId ?? null)
      setPhase('success')
    })
  }

  const slideVariants = {
    enter: { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[hsl(var(--color-bg))] px-6 pb-12 pt-24">
      <Wordmark />

      <AnimatePresence mode="wait">
        {phase === 'preview' && (
          <motion.div
            key="preview"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex w-full justify-center"
          >
            <ContractPreviewPhase
              contract={contract}
              currentUser={authenticatedUser}
              onNewUser={() => {
                setActionError(null)
                setPhase('new_user')
              }}
              onExistingUser={() => {
                setActionError(null)
                setPhase('existing_user')
              }}
              onAcceptDirectly={() => {
                handleAccept({ mode: 'current_user' })
              }}
            />
          </motion.div>
        )}

        {phase === 'new_user' && (
          <motion.div
            key="new_user"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex w-full justify-center"
          >
            <NewUserPhase
              onBack={() => setPhase('preview')}
              onComplete={(payload) => {
                handleAccept({
                  mode: 'new_user',
                  name: payload.name,
                  email: payload.email,
                  password: payload.password,
                })
              }}
            />
          </motion.div>
        )}

        {phase === 'existing_user' && (
          <motion.div
            key="existing_user"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex w-full justify-center"
          >
            <ExistingUserPhase
              onBack={() => setPhase('preview')}
              onComplete={({ email, password }) => {
                handleAccept({
                  mode: 'existing_user',
                  email,
                  password,
                })
              }}
            />
          </motion.div>
        )}

        {phase === 'success' && contractId && (
          <motion.div
            key="success"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex w-full justify-center"
          >
            <SuccessPhase contractId={contractId} contractTitle={contract.title} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== 'success' && actionError && (
        <div className="mt-6 w-full max-w-[480px]">
          <ErrorBox error={actionError} />
        </div>
      )}

      <div className="mt-10 text-center text-xs text-[hsl(var(--color-text-3))]">
        Need help?{' '}
        <Link href="/login" className="text-[hsl(var(--color-text-2))]">
          Sign in
        </Link>
      </div>
    </div>
  )
}
