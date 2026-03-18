import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: React.ReactNode
  }
  className?: string
  size?: 'sm' | 'md'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'md' ? 'px-8 py-16' : 'px-4 py-8',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]',
            size === 'md' ? 'mb-5 p-4' : 'mb-4 p-3'
          )}
        >
          {icon}
        </div>
      )}
      <p
        className={cn(
          'mb-2 font-semibold text-[hsl(var(--color-text-1))]',
          size === 'md' ? 'text-base' : 'text-sm'
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            'mb-6 max-w-sm leading-relaxed text-[hsl(var(--color-text-3))]',
            size === 'md' ? 'text-sm' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex">
            <Button
              variant="secondary"
              size={size === 'md' ? 'md' : 'sm'}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            variant="secondary"
            size={size === 'md' ? 'md' : 'sm'}
            leftIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
