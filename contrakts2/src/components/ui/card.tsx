import * as React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  selected?: boolean
  padded?: boolean
  glass?: boolean
}

function Card({
  className,
  hoverable,
  selected,
  padded = true,
  glass,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)]',
        glass
          ? 'glass border border-[hsl(var(--glass-border))]'
          : 'bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))]',
        padded && 'p-5',
        hoverable && [
          'cursor-pointer transition-all duration-200',
          'hover:border-[hsl(var(--color-border-2))]',
          'hover:shadow-card-hover',
          'hover:-translate-y-0.5',
        ],
        selected && [
          'border-[hsl(var(--color-accent)/0.5)]',
          'bg-[hsl(var(--color-accent)/0.04)]',
          'shadow-glow-accent-sm',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-4', className)} {...props} />
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-[hsl(var(--color-text-1))] leading-tight',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-[hsl(var(--color-text-2))] leading-relaxed',
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center pt-4 mt-4 border-t border-[hsl(var(--color-border))]',
        className
      )}
      {...props}
    />
  )
}

const accentColorMap: Record<string, { border: string; iconBg: string }> = {
  accent: {
    border: 'border-l-[hsl(var(--color-accent)/0.5)]',
    iconBg: 'bg-[hsl(var(--color-accent-dim))]',
  },
  success: {
    border: 'border-l-[hsl(var(--color-success)/0.5)]',
    iconBg: 'bg-[hsl(var(--color-success-dim))]',
  },
  warning: {
    border: 'border-l-[hsl(var(--color-warning)/0.5)]',
    iconBg: 'bg-[hsl(var(--color-warning-dim))]',
  },
  danger: {
    border: 'border-l-[hsl(var(--color-danger)/0.5)]',
    iconBg: 'bg-[hsl(var(--color-danger-dim))]',
  },
  gold: {
    border: 'border-l-[hsl(var(--color-gold)/0.5)]',
    iconBg: 'bg-[hsl(var(--color-gold-dim))]',
  },
}

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon,
  accentColor,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  accentColor?: string
}) {
  const colors = accentColor
    ? accentColorMap[accentColor]
    : undefined

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 transition-all duration-200',
        'hover:border-[hsl(var(--color-border-2))] hover:shadow-card',
        colors && `border-l-2 ${colors.border}`
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[hsl(var(--color-text-3))] uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-200 group-hover:scale-110',
              colors?.iconBg ?? 'bg-[hsl(var(--color-surface-2))]'
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[hsl(var(--color-text-1))] leading-none mb-1 animate-count-up">
        {value}
      </p>
      {sub && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trend === 'up' && (
            <TrendingUp size={12} className="text-[hsl(var(--color-success))]" />
          )}
          {trend === 'down' && (
            <TrendingDown size={12} className="text-[hsl(var(--color-danger))]" />
          )}
          <p
            className={cn(
              'text-xs',
              trend === 'up' && 'text-[hsl(var(--color-success))]',
              trend === 'down' && 'text-[hsl(var(--color-danger))]',
              (!trend || trend === 'neutral') && 'text-[hsl(var(--color-text-3))]'
            )}
          >
            {sub}
          </p>
        </div>
      )}
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
}
