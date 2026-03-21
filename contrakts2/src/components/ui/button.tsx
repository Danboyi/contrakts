import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold text-sm rounded-md',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-[hsl(var(--color-accent)/0.5)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--color-bg))]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[hsl(var(--color-accent))] text-white',
          'hover:bg-[hsl(var(--color-accent-hover))]',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-1))]',
          'border border-[hsl(var(--color-border))]',
          'hover:border-[hsl(var(--color-border-2))]',
          'hover:bg-[hsl(var(--color-surface-3))]',
        ],
        ghost: [
          'bg-transparent text-[hsl(var(--color-text-2))]',
          'hover:bg-[hsl(var(--color-surface-2))]',
          'hover:text-[hsl(var(--color-text-1))]',
        ],
        destructive: [
          'bg-[hsl(var(--color-danger))] text-white',
          'shadow-sm hover:shadow-md',
        ],
        outline: [
          'bg-transparent text-[hsl(var(--color-text-1))]',
          'border border-[hsl(var(--color-border-2))]',
          'hover:bg-[hsl(var(--color-surface))]',
          'hover:border-[hsl(var(--color-border-2))]',
        ],
        link: [
          'bg-transparent text-[hsl(var(--color-accent))]',
          'underline-offset-4 hover:underline p-0 h-auto font-medium',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        md: 'h-[44px] px-4 text-sm rounded-[var(--radius-md)]',
        lg: 'h-12 px-6 text-base rounded-[var(--radius-md)]',
        icon: 'h-9 w-9 rounded-[var(--radius-md)]',
        'icon-sm': 'h-7 w-7 rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : leftIcon}
        {children && <span>{children}</span>}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
