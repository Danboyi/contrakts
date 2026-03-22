'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  FileText,
  Scale,
  Signature,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ContractState =
  | 'draft'
  | 'pending'
  | 'active'
  | 'funded'
  | 'in_review'
  | 'complete'
  | 'disputed'
  | 'cancelled'

const STATES: {
  key: ContractState
  label: string
  icon: typeof Circle
  description: string
}[] = [
  {
    key: 'draft',
    label: 'Draft',
    icon: FileText,
    description: 'Contract is being created',
  },
  {
    key: 'pending',
    label: 'Pending signature',
    icon: Signature,
    description: 'Waiting for counterparty to sign',
  },
  {
    key: 'funded',
    label: 'Funded',
    icon: DollarSign,
    description: 'Escrow funded, work can begin',
  },
  {
    key: 'in_review',
    label: 'In review',
    icon: Clock,
    description: 'Delivery submitted for review',
  },
  {
    key: 'complete',
    label: 'Complete',
    icon: CheckCircle2,
    description: 'All milestones paid out',
  },
]

const STATE_ORDER: ContractState[] = [
  'draft',
  'pending',
  'funded',
  'in_review',
  'complete',
]

function getStepStatus(
  step: ContractState,
  current: ContractState
): 'done' | 'active' | 'upcoming' {
  if (current === 'disputed' || current === 'cancelled') {
    const currentIndex = STATE_ORDER.indexOf('in_review')
    const stepIndex = STATE_ORDER.indexOf(step)
    if (stepIndex < currentIndex) return 'done'
    if (stepIndex === currentIndex) return 'active'
    return 'upcoming'
  }
  const currentIndex = STATE_ORDER.indexOf(current)
  const stepIndex = STATE_ORDER.indexOf(step)
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'upcoming'
}

export function ContractStateTimeline({
  state,
  className,
}: {
  state: ContractState
  className?: string
}) {
  const isDisputed = state === 'disputed'
  const isCancelled = state === 'cancelled'

  return (
    <div className={cn('w-full', className)}>
      {(isDisputed || isCancelled) && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm',
            isDisputed
              ? 'border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.08)] text-[hsl(var(--color-danger))]'
              : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
          )}
        >
          {isDisputed ? (
            <>
              <Scale size={14} />
              <span className="font-medium">Dispute in progress</span>
            </>
          ) : (
            <>
              <Circle size={14} />
              <span className="font-medium">Contract cancelled</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-start">
        {STATES.map((step, index) => {
          const status = getStepStatus(step.key, state)
          const isLast = index === STATES.length - 1
          const Icon = step.icon

          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-1/2 top-4 h-0.5 w-full translate-x-[50%]">
                  <div
                    className={cn(
                      'h-full transition-colors duration-500',
                      status === 'done'
                        ? 'bg-[hsl(var(--color-success))]'
                        : 'bg-[hsl(var(--color-border))]'
                    )}
                  />
                </div>
              )}

              {/* Node */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.07,
                }}
                className={cn(
                  'relative z-10 mb-2.5 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                  status === 'done' &&
                    'border-[hsl(var(--color-success))] bg-[hsl(var(--color-success)/0.12)]',
                  status === 'active' &&
                    'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.12)] shadow-[0_0_0_4px_hsl(var(--color-accent)/0.1)]',
                  status === 'upcoming' &&
                    'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
                )}
              >
                {status === 'done' ? (
                  <CheckCircle2
                    size={14}
                    className="text-[hsl(var(--color-success))]"
                  />
                ) : (
                  <Icon
                    size={13}
                    className={cn(
                      status === 'active'
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-3))]'
                    )}
                  />
                )}
                {/* Pulse ring for active */}
                {status === 'active' && (
                  <span className="absolute h-8 w-8 animate-ping rounded-full bg-[hsl(var(--color-accent)/0.2)]" />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 + 0.1 }}
                className={cn(
                  'max-w-[80px] text-center text-[11px] leading-tight',
                  status === 'active'
                    ? 'font-semibold text-[hsl(var(--color-text-1))]'
                    : status === 'done'
                      ? 'font-medium text-[hsl(var(--color-success))]'
                      : 'text-[hsl(var(--color-text-3))]'
                )}
              >
                {step.label}
              </motion.span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ContractStateTimeline
