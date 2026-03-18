import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[hsl(var(--color-text-2))] select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full min-h-[100px] rounded-[var(--radius-md)] px-4 py-3',
            'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-1))]',
            'border border-[hsl(var(--color-border))]',
            'text-sm placeholder:text-[hsl(var(--color-text-3))]',
            'transition-all duration-150 outline-none resize-y',
            'focus:border-[hsl(var(--color-accent))]',
            'focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-[hsl(var(--color-danger))]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[hsl(var(--color-danger))]">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-[hsl(var(--color-text-3))]">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
