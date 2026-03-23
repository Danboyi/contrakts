'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Copy,
  PenLine,
  Send,
  Sparkles,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { Suspense, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ContractDrafter } from '@/components/ai'
import {
  ContractPreview,
  RoleSelector,
  StepMilestones,
} from '@/components/contracts'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { StepIndicator } from '@/components/ui/step-indicator'
import { useContractBuilder } from '@/hooks/use-contract-builder'
import { useUser } from '@/hooks/use-user'
import type { AiContractDraft } from '@/lib/ai/types'
import { createContract } from '@/lib/contracts/actions'
import {
  ROLE_LABELS,
  getCounterpartyRole,
} from '@/lib/types/negotiation'
import { createClient } from '@/lib/supabase/client'
import { CURRENCIES, INDUSTRIES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  { label: 'Your role' },
  { label: 'Details' },
  { label: 'Milestones' },
  { label: 'Review & Send' },
] as const

const STEP_TITLES = [
  'Choose your role',
  'Contract details',
  'Define milestones',
  'Review and send',
] as const

const STEP_SUBTITLES = [
  'Either party can initiate. Your role determines who funds and who delivers.',
  'Define the deal, the other party, and the terms they will review.',
  'Break the work into milestones so both parties can negotiate clear outcomes.',
  'Review the full contract package before sending it for negotiation.',
] as const

const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -32 : 32,
  }),
}

const fieldClassName = cn(
  'w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
  'bg-[hsl(var(--color-surface))] px-3 py-2.5',
  'text-sm text-[hsl(var(--color-text-1))]',
  'placeholder:text-[hsl(var(--color-text-3))]',
  'transition-all duration-150',
  'focus:border-[hsl(var(--color-accent))]',
  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.5)]',
  'min-h-[44px]'
)

type EntryMode = 'choose' | 'ai' | 'manual'

function formatPlainAmount(value: number) {
  if (!Number.isFinite(value)) {
    return ''
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b border-[hsl(var(--color-border))] py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <span className="text-xs text-[hsl(var(--color-text-3))]">{label}</span>
      <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
        {value}
      </span>
    </div>
  )
}

function StepPreview({
  number,
  text,
}: {
  number: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
          'bg-[hsl(var(--color-accent)/0.15)] text-[10px] font-bold text-[hsl(var(--color-accent))]'
        )}
      >
        {number}
      </span>
      <span className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
        {text}
      </span>
    </div>
  )
}

function NewContractPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const initialMode: EntryMode = templateId ? 'manual' : 'choose'
  const { user } = useUser()
  const loadedTemplateRef = useRef<string | null>(null)
  const [mode, setMode] = useState<EntryMode>(initialMode)
  const [direction, setDirection] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successModal, setSuccessModal] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [createdContractId, setCreatedContractId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    step,
    data,
    errors,
    totalAmount,
    platformFee,
    netToVendor,
    update,
    updateMilestone,
    addMilestone,
    removeMilestone,
    moveMilestone,
    next,
    goToStep,
    back,
    clearDraft,
  } = useContractBuilder()

  useEffect(() => {
    if (!templateId || loadedTemplateRef.current === templateId) {
      return
    }

    const activeTemplateId = templateId
    loadedTemplateRef.current = activeTemplateId
    setMode('manual')

    async function loadTemplate() {
      const supabase = createClient()
      const { data: templateData } = await supabase
        .from('contract_templates')
        .select(
          `
            *,
            milestones:template_milestones(
              id,
              order_index,
              title,
              description,
              amount_hint
            )
          `
        )
        .eq('id', activeTemplateId)
        .single()

      const template = templateData as
        | (Record<string, unknown> & {
            milestones?: Array<{
              id: string
              order_index: number
              title: string
              description: string | null
              amount_hint: number | null
            }>
          })
        | null

      if (!template) {
        return
      }

      update('title', String(template.title ?? ''))
      update(
        'description',
        typeof template.description === 'string' ? template.description : ''
      )
      update('industry', String(template.industry ?? ''))
      update('currency', String(template.currency ?? 'USD'))
      update('terms', typeof template.terms === 'string' ? template.terms : '')

      const sortedMilestones = [...(template.milestones ?? [])].sort(
        (left, right) => left.order_index - right.order_index
      )

      if (sortedMilestones.length > 0) {
        update(
          'milestones',
          sortedMilestones.map((milestone) => ({
            id: nanoid(),
            title: milestone.title,
            description: milestone.description ?? '',
            amount: milestone.amount_hint ? String(milestone.amount_hint) : '',
            deadline: '',
          }))
        )

        const templateTotal = sortedMilestones.reduce(
          (sum, milestone) => sum + (milestone.amount_hint ?? 0),
          0
        )
        if (templateTotal > 0) {
          update('total_value', formatPlainAmount(templateTotal))
        }
      }

      const { useTemplate: incrementTemplateUse } = await import(
        '@/lib/templates/actions'
      )
      await incrementTemplateUse(activeTemplateId)
    }

    void loadTemplate()
  }, [templateId, update])

  const userName = user?.full_name?.trim() || 'You'
  const initiatorRole = data.initiator_role
  const counterpartyRole = initiatorRole
    ? getCounterpartyRole(initiatorRole)
    : null
  const categoryLabel =
    INDUSTRIES.find((industry) => industry.value === data.industry)?.label ??
    data.industry
  const quotedTotal = Number.parseFloat(data.total_value)
  const displayTotal =
    !Number.isNaN(quotedTotal) && quotedTotal > 0 ? quotedTotal : totalAmount
  const formattedDisplayTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
  }).format(displayTotal || 0)
  const formattedMilestoneTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD',
  }).format(totalAmount || 0)

  function handleApplyDraft(draft: AiContractDraft, targetStep = 3) {
    setServerError(null)
    setDirection(1)
    setMode('manual')
    update('title', draft.title)
    update('description', draft.description)
    update('industry', draft.industry)
    update('currency', draft.currency)
    update('terms', draft.terms)
    update(
      'milestones',
      draft.milestones.map((milestone) => ({
        id: nanoid(),
        title: milestone.title,
        description: [
          milestone.description,
          `Target completion: approximately ${milestone.deadline_days} days from project start.`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        amount: String(milestone.amount / 100),
        deadline: '',
      }))
    )

    const aiTotal = draft.milestones.reduce(
      (sum, milestone) => sum + milestone.amount / 100,
      0
    )
    if (aiTotal > 0) {
      update('total_value', formatPlainAmount(aiTotal))
    }

    goToStep(data.initiator_role ? Math.min(targetStep, 3) : 0)

    toast.success(
      data.initiator_role
        ? 'Draft applied. Review the details, then send.'
        : 'Draft applied. Pick your role first, then continue.'
    )
  }

  function handleNext() {
    setServerError(null)
    setDirection(1)
    next()
  }

  function handleBack() {
    setServerError(null)
    setDirection(-1)
    back()
  }

  function handleCloseSuccessModal(open: boolean) {
    setSuccessModal(open)
    if (!open) {
      router.push(createdContractId ? `/contracts/${createdContractId}` : '/contracts')
    }
  }

  function handleCopyInviteLink() {
    if (!inviteLink) {
      return
    }

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Could not copy the invite link'))
  }

  function handleSubmit() {
    if (!initiatorRole) {
      setServerError('Choose your role before sending the contract.')
      setDirection(-1)
      goToStep(0)
      return
    }

    setServerError(null)

    startTransition(async () => {
      const result = await createContract({
        title: data.title,
        description: data.description || undefined,
        industry: data.industry,
        currency: data.currency,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        terms: data.terms,
        initiator_role: initiatorRole,
        quoted_total_value:
          !Number.isNaN(quotedTotal) && quotedTotal > 0 ? quotedTotal : undefined,
        counterparty_name: data.counterparty_name,
        counterparty_email: data.counterparty_email,
        invite_message: data.invite_message || undefined,
        milestones: data.milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description || undefined,
          amount: parseFloat(milestone.amount),
          deadline: milestone.deadline || undefined,
        })),
      })

      if (result.error) {
        setServerError(result.error)
        return
      }

      setInviteLink(result.inviteLink ?? '')
      setCreatedContractId(result.contractId ?? null)
      clearDraft()
      setSuccessModal(true)
      setMobilePreviewOpen(false)
    })
  }

  if (mode === 'choose') {
    return (
      <div className="mx-auto w-full max-w-[760px] pt-4 sm:pt-6 lg:pt-8">
        <div className="mb-8 flex items-start gap-4 sm:mb-10">
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
              'transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
            )}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
              New contract
            </h1>
            <p className="mt-0.5 text-sm text-[hsl(var(--color-text-2))]">
              Choose the fastest way to get to a negotiation-ready contract.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setMode('ai')}
            className="group rounded-[var(--radius-xl)] border-2 border-[hsl(var(--color-accent)/0.3)] bg-[hsl(var(--color-accent)/0.05)] p-6 text-left transition-all duration-200 hover:border-[hsl(var(--color-accent)/0.55)] hover:bg-[hsl(var(--color-accent)/0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--color-accent)/0.15)] transition-colors duration-200 group-hover:bg-[hsl(var(--color-accent)/0.22)]">
                <Sparkles size={22} className="text-[hsl(var(--color-accent))]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-base font-semibold text-[hsl(var(--color-text-1))]">
                    Describe your deal
                  </p>
                  <span className="rounded-full bg-[hsl(var(--color-accent)/0.15)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--color-accent))]">
                    AI powered
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  Tell us what you are agreeing to in plain English. AI drafts
                  the contract structure, milestones, terms, and risks in
                  seconds.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--color-accent))]">
                  <ArrowRight size={13} />
                  Recommended
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => setMode('manual')}
            className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 text-left transition-all duration-200 hover:border-[hsl(var(--color-border-2))]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--color-surface-2))]">
                <PenLine size={18} className="text-[hsl(var(--color-text-3))]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  Build manually
                </p>
                <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                  Pick your role, fill each section, and send the contract out
                  for review.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    )
  }

  if (mode === 'ai') {
    return (
      <div className="mx-auto w-full max-w-[820px]">
        <div className="mb-6 flex items-start gap-3 sm:mb-8">
          <button
            type="button"
            onClick={() => setMode(templateId ? 'manual' : 'choose')}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
              'transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
            )}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
              AI contract drafter
            </h1>
            <p className="mt-0.5 text-sm text-[hsl(var(--color-text-2))]">
              Plain English in. Structured contract out.
            </p>
          </div>
        </div>

        <ContractDrafter onUseDraft={handleApplyDraft} />
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="mb-6 flex items-start gap-4 sm:mb-8">
          <button
            type="button"
            onClick={() => setMode(templateId ? 'manual' : 'choose')}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
              'transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
            )}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
              New contract
            </h1>
            <p className="mt-0.5 text-sm text-[hsl(var(--color-text-2))]">
              Build the contract, choose who is paying, and send it for review.
            </p>
          </div>
        </div>

        <div className="mb-6 w-full sm:mb-8">
          <StepIndicator
            steps={STEPS.map((stepItem) => ({ label: stepItem.label }))}
            current={step}
          />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="min-w-0 flex-1 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
            <div className="px-4 pb-0 pt-4 sm:px-6 sm:pt-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`header-${step}`}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--color-text-1))] sm:text-xl">
                    {STEP_TITLES[step]}
                  </h2>
                  <p className="mb-6 text-sm text-[hsl(var(--color-text-2))]">
                    {STEP_SUBTITLES[step]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="min-h-[360px] px-4 pb-6 sm:px-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`content-${step}`}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {step === 0 && (
                    <RoleSelector
                      selected={initiatorRole}
                      onSelect={(role) => update('initiator_role', role)}
                    />
                  )}

                  {step === 1 && initiatorRole && (
                    <div className="flex flex-col gap-6">
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-accent)/0.15)]',
                          'bg-[hsl(var(--color-accent)/0.06)] px-3 py-2',
                          'text-xs font-medium text-[hsl(var(--color-accent))]'
                        )}
                      >
                        You are the {ROLE_LABELS[initiatorRole]}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          {initiatorRole === 'service_provider'
                            ? 'Project / service title'
                            : 'What do you need done?'}
                        </label>
                        <input
                          value={data.title}
                          onChange={(event) => update('title', event.target.value)}
                          placeholder={
                            initiatorRole === 'service_provider'
                              ? 'e.g. Mobile app development - rider tracking'
                              : 'e.g. Need a mobile app built for food delivery'
                          }
                          className={fieldClassName}
                        />
                        {errors.title && (
                          <p className="text-xs text-[hsl(var(--color-danger))]">
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          {initiatorRole === 'service_provider'
                            ? "Describe what you'll deliver"
                            : 'Describe what you need'}
                        </label>
                        <textarea
                          value={data.description}
                          onChange={(event) =>
                            update('description', event.target.value)
                          }
                          rows={4}
                          placeholder={
                            initiatorRole === 'service_provider'
                              ? 'Outline the scope of work, deliverables, and timeline...'
                              : 'Describe the project requirements, expectations, and goals...'
                          }
                          className={cn(fieldClassName, 'resize-none')}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                            Category
                          </label>
                          <select
                            value={data.industry}
                            onChange={(event) => update('industry', event.target.value)}
                            className={fieldClassName}
                          >
                            <option value="">Select category</option>
                            {INDUSTRIES.map((industry) => (
                              <option key={industry.value} value={industry.value}>
                                {industry.label}
                              </option>
                            ))}
                          </select>
                          {errors.industry && (
                            <p className="text-xs text-[hsl(var(--color-danger))]">
                              {errors.industry}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                            Currency
                          </label>
                          <select
                            value={data.currency}
                            onChange={(event) => update('currency', event.target.value)}
                            className={fieldClassName}
                          >
                            {CURRENCIES.map((currency) => (
                              <option key={currency.value} value={currency.value}>
                                {currency.label}
                              </option>
                            ))}
                          </select>
                          {errors.currency && (
                            <p className="text-xs text-[hsl(var(--color-danger))]">
                              {errors.currency}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          Core terms and obligations
                        </label>
                        <textarea
                          value={data.terms}
                          onChange={(event) => update('terms', event.target.value)}
                          rows={6}
                          placeholder="Describe the scope, responsibilities, approvals, revisions, and any conditions both parties must agree to."
                          className={cn(fieldClassName, 'min-h-[160px] resize-none')}
                        />
                        <p className="text-xs text-[hsl(var(--color-text-3))]">
                          These terms are the starting point for negotiation. The
                          other party can accept or suggest changes.
                        </p>
                        {errors.terms && (
                          <p className="text-xs text-[hsl(var(--color-danger))]">
                            {errors.terms}
                          </p>
                        )}
                      </div>

                      <div
                        className={cn(
                          'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5'
                        )}
                      >
                        <h3 className="mb-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                          {counterpartyRole === 'service_receiver'
                            ? 'Who is the service receiver?'
                            : 'Who is the service provider?'}
                        </h3>
                        <p className="mb-4 text-xs text-[hsl(var(--color-text-3))]">
                          {counterpartyRole === 'service_receiver'
                            ? 'The person or business paying for the service. They will review your terms and fund escrow once both parties agree.'
                            : 'The person or business doing the work. They will review your terms and deliver against the milestones once both parties agree.'}
                        </p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[hsl(var(--color-text-2))]">
                              Their name
                            </label>
                            <input
                              value={data.counterparty_name}
                              onChange={(event) =>
                                update('counterparty_name', event.target.value)
                              }
                              placeholder="John Doe or Acme Corp"
                              className={cn(
                                fieldClassName,
                                'bg-[hsl(var(--color-bg))]'
                              )}
                            />
                            {errors.counterparty_name && (
                              <p className="text-xs text-[hsl(var(--color-danger))]">
                                {errors.counterparty_name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[hsl(var(--color-text-2))]">
                              Their email
                            </label>
                            <input
                              type="email"
                              value={data.counterparty_email}
                              onChange={(event) =>
                                update('counterparty_email', event.target.value)
                              }
                              placeholder="them@example.com"
                              className={cn(
                                fieldClassName,
                                'bg-[hsl(var(--color-bg))]'
                              )}
                            />
                            {errors.counterparty_email && (
                              <p className="text-xs text-[hsl(var(--color-danger))]">
                                {errors.counterparty_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      {data.total_value && (
                        <div
                          className={cn(
                            'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4'
                          )}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                                Total contract value
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                                {formattedDisplayTotal}
                              </p>
                            </div>
                            <div className="text-sm text-[hsl(var(--color-text-2))]">
                              Milestones currently total{' '}
                              <span className="font-semibold text-[hsl(var(--color-text-1))]">
                                {formattedMilestoneTotal}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <StepMilestones
                        data={data}
                        errors={errors}
                        updateMilestone={updateMilestone}
                        addMilestone={addMilestone}
                        removeMilestone={removeMilestone}
                        moveMilestone={moveMilestone}
                      />
                    </div>
                  )}

                  {step === 3 && initiatorRole && counterpartyRole && (
                    <div className="flex flex-col gap-6">
                      <div
                        className={cn(
                          'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5'
                        )}
                      >
                        <h3 className="mb-4 text-base font-semibold text-[hsl(var(--color-text-1))]">
                          Contract Summary
                        </h3>

                        <div
                          className={cn(
                            'mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-accent)/0.15)]',
                            'bg-[hsl(var(--color-accent)/0.08)] px-3 py-1.5',
                            'text-xs font-medium text-[hsl(var(--color-accent))]'
                          )}
                        >
                          You - {ROLE_LABELS[initiatorRole]}
                        </div>

                        <div className="flex flex-col gap-3">
                          <SummaryRow label="Title" value={data.title || 'Not set'} />
                          <SummaryRow label="Category" value={categoryLabel || 'Not set'} />
                          <SummaryRow label="Total value" value={formattedDisplayTotal} />
                          <SummaryRow
                            label="Timeline"
                            value={
                              data.start_date || data.end_date
                                ? `${data.start_date || 'TBD'} - ${data.end_date || 'TBD'}`
                                : 'Not set'
                            }
                          />
                          <SummaryRow
                            label={ROLE_LABELS[counterpartyRole]}
                            value={`${data.counterparty_name || 'Not set'} (${data.counterparty_email || 'Not set'})`}
                          />
                        </div>

                        <div className="mt-5 border-t border-[hsl(var(--color-border))] pt-5">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                            Milestones ({data.milestones.length})
                          </p>
                          <div className="flex flex-col gap-2">
                            {data.milestones.map((milestone, index) => (
                              <div
                                key={milestone.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="min-w-0 truncate text-sm text-[hsl(var(--color-text-1))]">
                                  {milestone.title || `Milestone ${index + 1}`}
                                </span>
                                <span className="shrink-0 text-sm font-medium text-[hsl(var(--color-text-1))]">
                                  {milestone.amount
                                    ? new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: data.currency || 'USD',
                                      }).format(Number.parseFloat(milestone.amount) || 0)
                                    : 'Not set'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'rounded-[var(--radius-lg)] border border-[hsl(var(--color-accent)/0.1)] bg-[hsl(var(--color-accent)/0.04)] p-4'
                        )}
                      >
                        <p className="mb-2 text-sm font-medium text-[hsl(var(--color-text-1))]">
                          What happens next
                        </p>
                        <div className="flex flex-col gap-2">
                          <StepPreview
                            number="1"
                            text={`${data.counterparty_name || 'The other party'} receives an email invitation to review this contract.`}
                          />
                          <StepPreview
                            number="2"
                            text="They can accept your terms or suggest changes. You will be notified either way."
                          />
                          <StepPreview
                            number="3"
                            text={
                              initiatorRole === 'service_provider'
                                ? `Once both parties agree, ${data.counterparty_name || 'the service receiver'} signs and funds the escrow. You start delivering.`
                                : `Once both parties agree, you sign and fund the escrow. ${data.counterparty_name || 'the service provider'} starts delivering.`
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          Add a message (optional)
                        </label>
                        <textarea
                          value={data.invite_message}
                          onChange={(event) =>
                            update('invite_message', event.target.value)
                          }
                          rows={3}
                          placeholder={
                            initiatorRole === 'service_provider'
                              ? "Hi! Here's the proposal for the project we discussed..."
                              : "Hi! I'd like you to take a look at this project..."
                          }
                          className={cn(fieldClassName, 'resize-none')}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {serverError && (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] p-3 text-sm text-[hsl(var(--color-danger))]">
                  {serverError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.5)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0 || isPending}
                leftIcon={<ArrowLeft size={15} />}
                className="w-full sm:w-auto"
              >
                Back
              </Button>

              <div className="order-first flex items-center justify-center gap-2 sm:order-none">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      index === step
                        ? 'h-1.5 w-4 bg-[hsl(var(--color-accent))]'
                        : index < step
                          ? 'h-1.5 w-1.5 bg-[hsl(var(--color-success))]'
                          : 'h-1.5 w-1.5 bg-[hsl(var(--color-border-2))]'
                    )}
                  />
                ))}
              </div>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isPending || (step === 0 && !initiatorRole)}
                  rightIcon={<ArrowRight size={15} />}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={isPending}
                  leftIcon={<Send size={15} />}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  Send contract
                </Button>
              )}
            </div>
          </div>

          <div className="w-full xl:w-[400px] xl:flex-shrink-0">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:p-5 xl:sticky xl:top-8 xl:self-start">
              <button
                type="button"
                onClick={() => setMobilePreviewOpen((value) => !value)}
                className="flex min-h-[44px] w-full items-center justify-between text-left xl:hidden"
              >
                <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  Preview
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-[hsl(var(--color-text-3))] transition-transform duration-200',
                    mobilePreviewOpen && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'xl:block',
                  mobilePreviewOpen ? 'block' : 'hidden xl:block'
                )}
              >
                <ContractPreview
                  data={data}
                  totalAmount={totalAmount}
                  platformFee={platformFee}
                  netToVendor={netToVendor}
                  userName={userName}
                  className="static top-auto border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={successModal}
        onOpenChange={handleCloseSuccessModal}
        title="Contract sent"
        description="Your contract has been created and the invite is ready."
        hideClose
        size="sm"
      >
        <div className="flex flex-col items-stretch py-2 sm:items-center sm:py-4 sm:text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
            <CheckCircle size={26} className="text-[hsl(var(--color-success))]" />
          </div>
          <p className="mb-5 text-left text-sm leading-relaxed text-[hsl(var(--color-text-2))] sm:text-center">
            {initiatorRole === 'service_provider'
              ? 'Share this link with the service receiver if they do not see the email. They can review your terms, accept them, or send back changes. Once both parties agree, they sign and fund escrow so you can start delivering.'
              : 'Share this link with the service provider if they do not see the email. They can review your terms, accept them, or send back changes. Once both parties agree, you will sign and fund escrow so delivery can begin.'}
          </p>

          <div className="mb-5 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 overflow-hidden rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg))] px-3 py-3">
                <p className="break-all text-left font-mono text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  {inviteLink}
                </p>
              </div>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className={cn(
                'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium sm:w-auto sm:flex-shrink-0',
                'text-[hsl(var(--color-text-3))] transition-all duration-150',
                'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              <Copy size={14} />
              Copy link
            </button>
          </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => router.push('/contracts')}>
            View all contracts
          </Button>
          <Button
            onClick={() =>
              router.push(
                createdContractId ? `/contracts/${createdContractId}` : '/contracts'
              )
            }
          >
            Open contract
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default function NewContractPage() {
  return (
    <Suspense fallback={null}>
      <NewContractPageContent />
    </Suspense>
  )
}
