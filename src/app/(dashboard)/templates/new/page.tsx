'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  StepDetails,
  StepMilestones,
  StepTerms,
} from '@/components/contracts'
import { Button } from '@/components/ui/button'
import { StepIndicator } from '@/components/ui/step-indicator'
import { useContractBuilder } from '@/hooks/use-contract-builder'
import { saveTemplate } from '@/lib/templates/actions'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  { label: 'Details' },
  { label: 'Milestones' },
  { label: 'Terms' },
  { label: 'Review' },
]

const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 24 : -24,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
  }),
}

export default function NewTemplatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [direction, setDirection] = useState(1)
  const [isPublic, setIsPublic] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const {
    step,
    data,
    errors,
    update,
    updateMilestone,
    addMilestone,
    removeMilestone,
    moveMilestone,
    next,
    back,
  } = useContractBuilder({
    requireMilestoneAmounts: false,
    requireCounterparty: false,
    storageKey: 'contrakts_template_builder_draft',
  })

  function handleNext() {
    setDirection(1)
    next()
  }

  function handleBack() {
    setDirection(-1)
    back()
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveTemplate({
        title: data.title,
        description: data.description || undefined,
        industry: data.industry,
        currency: data.currency,
        terms: data.terms || undefined,
        is_public: isPublic,
        milestones: data.milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description || undefined,
          amount_hint: milestone.amount
            ? Number.parseFloat(milestone.amount)
            : undefined,
        })),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setSavedId(result.templateId ?? null)
      setSaved(true)
    })
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-[480px] pt-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
          <CheckCircle size={28} className="text-[hsl(var(--color-success))]" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--color-text-1))]">
          Template saved
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
          &quot;{data.title}&quot; is ready to use. Start a contract from this
          template any time from your template library.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push('/templates')}>
            View templates
          </Button>
          <Button
            onClick={() =>
              router.push(
                savedId ? `/contracts/new?template=${savedId}` : '/contracts/new'
              )
            }
            rightIcon={<ArrowRight size={15} />}
          >
            Use this template
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            'rounded-[var(--radius-md)] p-2 text-[hsl(var(--color-text-3))]',
            'transition-all duration-150 hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
          )}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
            Create template
          </h1>
          <p className="mt-0.5 text-sm text-[hsl(var(--color-text-2))]">
            Build a reusable contract template for repeat work.
          </p>
        </div>
      </div>

      <div className="mb-8 max-w-[500px]">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="max-w-[640px]">
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
          <div className="px-6 pt-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`header-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                  {[
                    'Template details',
                    'Add milestones',
                    'Default terms',
                    'Review & save',
                  ][step]}
                </h2>
                <p className="mb-6 text-sm text-[hsl(var(--color-text-2))]">
                  {[
                    'Give your template a clear name for easy reuse.',
                    'Add milestone structures. Amounts are hints that can change later.',
                    'Define the default terms for this template type.',
                    'Review your template before saving.',
                  ][step]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-h-[300px] px-6 pb-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`content-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
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
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Title', value: data.title },
                      { label: 'Industry', value: data.industry },
                      { label: 'Currency', value: data.currency },
                      {
                        label: 'Milestones',
                        value: `${data.milestones.length} milestone${data.milestones.length !== 1 ? 's' : ''}`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between border-b border-[hsl(var(--color-border))] py-3 last:border-0"
                      >
                        <span className="text-xs uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                          {label}
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                          {value}
                        </span>
                      </div>
                    ))}

                    <div
                      className={cn(
                        'mt-2 flex items-start gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
                        'bg-[hsl(var(--color-surface-2))] p-4'
                      )}
                    >
                      <div className="flex-1">
                        <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                          Make template public
                        </p>
                        <p className="text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
                          Public templates are visible to other Contrakts users.
                          They can use them, but they cannot edit them.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPublic((current) => !current)}
                        className={cn(
                          'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200',
                          isPublic
                            ? 'bg-[hsl(var(--color-accent))]'
                            : 'bg-[hsl(var(--color-border-2))]'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200',
                            isPublic ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.5)] px-6 py-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
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

            {step < 3 ? (
              <Button onClick={handleNext} rightIcon={<ArrowRight size={15} />}>
                Continue
              </Button>
            ) : (
              <Button
                loading={isPending}
                onClick={handleSave}
                leftIcon={<Layers size={15} />}
              >
                Save template
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
