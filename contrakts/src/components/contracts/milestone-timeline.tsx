'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'

interface MilestoneTimelineProps {
  milestones: Array<{
    id: string
    title: string
    amount: number
    state: string
    order_index: number
  }>
  currency: string
}

const stateColors: Record<string, { node: string; bg: string; text: string }> = {
  pending: {
    node: 'bg-[hsl(var(--color-text-3))]',
    bg: 'bg-[hsl(var(--color-text-3)/0.12)]',
    text: 'text-[hsl(var(--color-text-3))]',
  },
  in_progress: {
    node: 'bg-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.12)]',
    text: 'text-[hsl(var(--color-accent))]',
  },
  submitted: {
    node: 'bg-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.12)]',
    text: 'text-[hsl(var(--color-warning))]',
  },
  approved: {
    node: 'bg-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.12)]',
    text: 'text-[hsl(var(--color-success))]',
  },
  paid: {
    node: 'bg-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.12)]',
    text: 'text-[hsl(var(--color-success))]',
  },
  disputed: {
    node: 'bg-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.12)]',
    text: 'text-[hsl(var(--color-danger))]',
  },
}

const defaultColors = stateColors.pending

function getColors(state: string) {
  return stateColors[state] ?? defaultColors
}

function isCompleted(state: string) {
  return state === 'approved' || state === 'paid'
}

export function MilestoneTimeline({ milestones, currency }: MilestoneTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="flex items-start"
        style={{ minWidth: `${Math.max(sorted.length * 160, 320)}px` }}
      >
        {sorted.map((milestone, index) => {
          const colors = getColors(milestone.state)
          const isCurrent = milestone.state === 'in_progress'
          const isLast = index === sorted.length - 1

          return (
            <motion.div
              key={milestone.id}
              className="relative flex flex-1 flex-col items-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              {/* Amount above */}
              <motion.span
                className={cn(
                  'mb-3 text-xs font-semibold',
                  colors.text
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 + 0.15 }}
              >
                {formatCurrency(milestone.amount, currency)}
              </motion.span>

              {/* Node row with connecting lines */}
              <div className="relative flex w-full items-center justify-center">
                {/* Line to the left */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute right-1/2 h-0.5 w-full',
                      isCompleted(sorted[index - 1].state) && isCompleted(milestone.state)
                        ? 'bg-[hsl(var(--color-success))]'
                        : 'bg-[hsl(var(--color-border))]'
                    )}
                    style={{ transform: 'translateX(-50%)' }}
                  />
                )}

                {/* Line to the right */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-1/2 h-0.5 w-full',
                      isCompleted(milestone.state) && isCompleted(sorted[index + 1].state)
                        ? 'bg-[hsl(var(--color-success))]'
                        : 'bg-[hsl(var(--color-border))]'
                    )}
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}

                {/* Pulse ring for current milestone */}
                {isCurrent && (
                  <span
                    className="absolute h-7 w-7 animate-ping rounded-full bg-[hsl(var(--color-accent)/0.25)]"
                    style={{ animationDuration: '2s' }}
                  />
                )}

                {/* Outer ring */}
                <motion.div
                  className={cn(
                    'relative z-10 flex h-5 w-5 items-center justify-center rounded-full',
                    colors.bg,
                    isCurrent && 'h-7 w-7'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 20,
                    delay: index * 0.08 + 0.05,
                  }}
                >
                  {/* Inner dot */}
                  <div
                    className={cn(
                      'rounded-full',
                      colors.node,
                      isCurrent ? 'h-3 w-3' : 'h-2.5 w-2.5'
                    )}
                  />
                </motion.div>
              </div>

              {/* Title below */}
              <motion.span
                className={cn(
                  'mt-3 max-w-[120px] text-center text-[11px] leading-tight',
                  isCurrent
                    ? 'font-medium text-[hsl(var(--color-text-1))]'
                    : 'text-[hsl(var(--color-text-3))]'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 + 0.15 }}
              >
                {milestone.title}
              </motion.span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
