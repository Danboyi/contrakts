'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Eye,
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
  StepCounterparty,
  StepDetails,
  StepMilestones,
  StepReview,
  StepTerms,
} from '@/components/contracts'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { StepIndicator } from '@/components/ui/step-indicator'
import { useContractBuilder } from '@/hooks/use-contract-builder'
import { useUser } from '@/hooks/use-user'
import type { AiContractDraft } from '@/lib/ai/types'
import { createContract } from '@/lib/contracts/actions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  { label: 'Details' },
  { label: 'Milestones' },
  { label: 'Terms' },
  { label: 'Counterparty' },
  { label: 'Review' },
] as const

const STEP_TITLES = [
  'Contract details',
  'Add milestones',
  'Terms and conditions',
  'Invite counterparty',
  'Review and send',
] as const

const STEP_SUBTITLES = [
  'Give your contract a clear title and set the basic parameters.',
  'Break the work into milestones. Payment releases per approval.',
  'Define what both parties are agreeing to.',
  'Add the other party so they can review and sign.',
  'Review everything carefully before sending.',
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

type EntryMode = 'choose' | 'ai' | 'manual'

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
      }

      const { useTemplate: incrementTemplateUse } = await import(
        '@/lib/templates/actions'
      )
      await incrementTemplateUse(activeTemplateId)
    }

    void loadTemplate()
  }, [templateId, update])

  const userName = user?.full_name?.trim() || 'You'
  const previewTitle = data.title.trim() || 'Untitled contract'
  const previewCounterparty =
    data.counterparty_email.trim() || 'No counterparty yet'

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
    goToStep(targetStep)

    toast.success(
      targetStep >= 3
        ? 'Draft applied. Add the counterparty, then send.'
        : 'Draft applied. You can edit this section now.'
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
      router.push('/contracts')
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
        counterparty_email: data.counterparty_email || undefined,
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
      clearDraft()
      setSuccessModal(true)
      setMobilePreviewOpen(false)
    })
  }

  if (mode === 'choose') {
    return (
      <div className="mx-auto max-w-[680px] pt-8">
        <div className="mb-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              'rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
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
              Choose the fastest way to get to a send-ready contract.
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
                  Fill in each section yourself for full control from the start.
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
      <div className="mx-auto max-w-[760px]">
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode(templateId ? 'manual' : 'choose')}
            className={cn(
              'rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
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
      <div>
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMode(templateId ? 'manual' : 'choose')}
            className={cn(
              'rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
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
              Fill in the details below. Your draft auto-saves as you go.
            </p>
          </div>
        </div>

        <div className="mb-8 max-w-[640px]">
          <StepIndicator
            steps={STEPS.map((stepItem) => ({ label: stepItem.label }))}
            current={step}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
            <div className="px-6 pb-0 pt-6">
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
                  <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                    {STEP_TITLES[step]}
                  </h2>
                  <p className="mb-6 text-sm text-[hsl(var(--color-text-2))]">
                    {STEP_SUBTITLES[step]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="min-h-[360px] px-6 pb-6">
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
                    <StepDetails data={data} errors={errors} update={update} />
                  )}
                  {step === 1 && (
                    <StepMilestones
                      data={data}
                      errors={errors}
                      updateMilestone={updateMilestone}
                      addMilestone={addMilestone}
                      removeMilestone={removeMilestone}
                      moveMilestone={moveMilestone}
                    />
                  )}
                  {step === 2 && (
                    <StepTerms data={data} errors={errors} update={update} />
                  )}
                  {step === 3 && (
                    <StepCounterparty
                      data={data}
                      errors={errors}
                      update={update}
                    />
                  )}
                  {step === 4 && (
                    <StepReview
                      data={data}
                      totalAmount={totalAmount}
                      platformFee={platformFee}
                      netToVendor={netToVendor}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {serverError && (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] p-3 text-sm text-[hsl(var(--color-danger))]">
                  {serverError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.5)] px-6 py-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0 || isPending}
                leftIcon={<ArrowLeft size={15} />}
              >
                Back
              </Button>

              <div className="flex items-center gap-2">
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
                  disabled={isPending}
                  rightIcon={<ArrowRight size={15} />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={isPending}
                  leftIcon={<Send size={15} />}
                >
                  Send contract
                </Button>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <ContractPreview
              data={data}
              totalAmount={totalAmount}
              platformFee={platformFee}
              netToVendor={netToVendor}
              userName={userName}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-[84px] z-20 lg:hidden">
        <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))/0.98] p-3 shadow-[0_18px_40px_hsl(0_0%_0%/0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                {previewTitle}
              </p>
              <p className="truncate text-xs text-[hsl(var(--color-text-3))]">
                {previewCounterparty}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Total
              </p>
              <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: data.currency || 'USD',
                }).format(totalAmount)}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobilePreviewOpen(true)}
              leftIcon={<Eye size={14} />}
            >
              Preview
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobilePreviewOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobilePreviewOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-4 bottom-[84px] z-50 max-h-[calc(100vh-7rem)] overflow-y-auto lg:hidden"
            >
              <div className="mb-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobilePreviewOpen(false)}
                >
                  Close
                </Button>
              </div>
              <ContractPreview
                data={data}
                totalAmount={totalAmount}
                platformFee={platformFee}
                netToVendor={netToVendor}
                userName={userName}
                className="static top-auto"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        open={successModal}
        onOpenChange={handleCloseSuccessModal}
        title="Contract sent"
        description="Your contract has been created and the invite has been dispatched."
        hideClose
        size="md"
      >
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
            <CheckCircle size={26} className="text-[hsl(var(--color-success))]" />
          </div>
          <p className="mb-5 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
            Share this link with the counterparty if they have not received the
            email. Once they sign, you will be notified to fund the escrow.
          </p>

          <div className="mb-5 flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-3">
            <p className="flex-1 truncate font-mono text-xs text-[hsl(var(--color-text-2))]">
              {inviteLink}
            </p>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className={cn(
                'shrink-0 rounded-[var(--radius-sm)] p-1.5',
                'text-[hsl(var(--color-text-3))] transition-all duration-150',
                'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => router.push('/contracts')}>
            View all contracts
          </Button>
          <Button onClick={() => router.push('/contracts')}>Done</Button>
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
