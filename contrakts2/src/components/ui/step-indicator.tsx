import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Step {
  label: string
  sublabel?: string
}

interface StepIndicatorProps {
  steps: Step[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex w-full items-center">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <div key={index} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                  done && 'bg-[hsl(var(--color-success))] text-white',
                  active &&
                    'bg-[hsl(var(--color-accent))] text-white shadow-[0_0_0_4px_hsl(var(--color-accent)/0.15)]',
                  !done &&
                    !active &&
                    'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
                )}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : index + 1}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'whitespace-nowrap text-xs font-medium',
                    active
                      ? 'text-[hsl(var(--color-text-1))]'
                      : 'text-[hsl(var(--color-text-3))]'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-3 mb-6 h-px flex-1 transition-all duration-300',
                  index < current
                    ? 'bg-[hsl(var(--color-success))]'
                    : 'bg-[hsl(var(--color-border))]'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
