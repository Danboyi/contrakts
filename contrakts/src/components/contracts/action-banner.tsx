'use client'

import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ActionBannerProps {
  variant: 'accent' | 'warning' | 'danger' | 'success' | 'neutral'
  message: string
  cta?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
}

const variantMap = {
  accent: {
    bg: 'bg-[hsl(var(--color-accent)/0.08)]',
    border: 'border-[hsl(var(--color-accent)/0.25)]',
    text: 'text-[hsl(var(--color-accent))]',
    icon: Info,
  },
  warning: {
    bg: 'bg-[hsl(var(--color-warning)/0.08)]',
    border: 'border-[hsl(var(--color-warning)/0.25)]',
    text: 'text-[hsl(var(--color-warning))]',
    icon: AlertTriangle,
  },
  danger: {
    bg: 'bg-[hsl(var(--color-danger)/0.08)]',
    border: 'border-[hsl(var(--color-danger)/0.25)]',
    text: 'text-[hsl(var(--color-danger))]',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-[hsl(var(--color-success)/0.08)]',
    border: 'border-[hsl(var(--color-success)/0.25)]',
    text: 'text-[hsl(var(--color-success))]',
    icon: CheckCircle,
  },
  neutral: {
    bg: 'bg-[hsl(var(--color-surface-2))]',
    border: 'border-[hsl(var(--color-border))]',
    text: 'text-[hsl(var(--color-text-2))]',
    icon: Info,
  },
} as const

export function ActionBanner({ variant, message, cta }: ActionBannerProps) {
  const config = variantMap[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border px-4 py-3',
        config.bg,
        config.border
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon size={15} className={cn('shrink-0', config.text)} />
        <p className={cn('text-sm leading-snug', config.text)}>{message}</p>
      </div>
      {cta && (
        <Button
          size="sm"
          variant={variant === 'danger' ? 'destructive' : 'secondary'}
          onClick={cta.onClick}
          loading={cta.loading}
          className="shrink-0"
        >
          {cta.label}
        </Button>
      )}
    </div>
  )
}
