import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, leftIcon, rightIcon, id, ...props },
    ref
  ) => {
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
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-3))] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-[44px] rounded-[var(--radius-md)]',
              'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-1))]',
              'border border-[hsl(var(--color-border))]',
              'text-sm placeholder:text-[hsl(var(--color-text-3))]',
              'transition-all duration-150 ease-out',
              'outline-none',
              'focus:border-[hsl(var(--color-accent))]',
              'focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error &&
                'border-[hsl(var(--color-danger))] focus:shadow-[0_0_0_3px_hsl(var(--color-danger)/0.12)]',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-3))]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[hsl(var(--color-danger))] flex items-center gap-1">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[hsl(var(--color-text-3))]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
