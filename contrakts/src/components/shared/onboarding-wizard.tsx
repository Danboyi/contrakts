'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, FileText, ArrowRightLeft, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'contrakts_onboarding_complete'

const steps = [
  {
    icon: Shield,
    title: 'Welcome to Contrakts',
    description:
      'The smart way to create, manage, and protect your business contracts with escrow-backed milestones.',
  },
  {
    icon: FileText,
    title: 'Create Contracts',
    description:
      "Define milestones, set terms, and invite the other party. Choose whether you're the vendor or client.",
  },
  {
    icon: ArrowRightLeft,
    title: 'Negotiate Freely',
    description:
      'Both parties can review and propose changes to milestones and terms until everyone agrees.',
  },
  {
    icon: DollarSign,
    title: 'Secure Payments',
    description:
      'Funds are held in escrow and released per milestone. No more chasing invoices.',
  },
] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
}

export function OnboardingWizard() {
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY)
      if (!completed) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable, don't show
    }
  }, [])

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
    setVisible(false)
  }, [])

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep])

  const back = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const isLastStep = currentStep === steps.length - 1
  const step = steps[currentStep]
  const Icon = step.icon

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-[hsl(var(--color-bg)/0.6)] backdrop-blur-sm'
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'relative w-full max-w-md mx-4 overflow-hidden',
          'bg-[hsl(var(--color-surface))]',
          'rounded-[var(--radius-xl)]',
          'shadow-2xl',
          'border border-[hsl(var(--color-border))]'
        )}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-8 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-8 bg-[hsl(var(--color-accent))]'
                  : 'w-2 bg-[hsl(var(--color-text-3)/0.3)]'
              )}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="relative h-[320px] flex items-center justify-center px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-x-8 flex flex-col items-center text-center"
            >
              {/* Illustration */}
              <div
                className={cn(
                  'flex items-center justify-center',
                  'w-20 h-20 mb-6 rounded-full',
                  'bg-[hsl(var(--color-accent)/0.1)]'
                )}
              >
                <Icon
                  size={36}
                  className="text-[hsl(var(--color-accent))]"
                  strokeWidth={1.5}
                />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[hsl(var(--color-text-1))] mb-3">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-base text-[hsl(var(--color-text-2))] leading-relaxed max-w-sm">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-8 pt-2">
          <div>
            {currentStep > 0 ? (
              <Button variant="ghost" size="md" onClick={back}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="md" onClick={complete}>
                Skip
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && !isLastStep && (
              <Button variant="ghost" size="md" onClick={complete}>
                Skip
              </Button>
            )}
            {isLastStep ? (
              <Button variant="primary" size="md" onClick={complete}>
                Get Started
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={next}>
                Next
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
