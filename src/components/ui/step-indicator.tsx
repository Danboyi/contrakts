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
    <div
      className={cn(
        'mb-6 flex items-center gap-0 overflow-x-auto pb-2',
        '-mx-4 px-4 sm:mx-0 sm:px-0',
        'scrollbar-hide'
      )}
    >
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <div key={step.label} className="flex flex-shrink-0 items-center">
            <div
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 sm:h-9 sm:w-9',
                done && 'bg-[hsl(var(--color-success))] text-white',
                active && 'bg-[hsl(var(--color-accent))] text-white',
                !done &&
                  !active &&
                  'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-3))]'
              )}
            >
              {done ? <Check size={14} /> : index + 1}
            </div>

            <div className="mr-4 ml-2 hidden min-w-0 sm:block">
              <p
                className={cn(
                  'text-xs transition-colors duration-200',
                  done || active
                    ? 'font-medium text-[hsl(var(--color-text-1))]'
                    : 'text-[hsl(var(--color-text-3))]'
                )}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
                  {step.sublabel}
                </p>
              )}
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-px w-6 sm:w-10',
                  index < current
                    ? 'bg-[hsl(var(--color-accent))]'
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
