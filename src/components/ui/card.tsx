import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  selected?: boolean
  padded?: boolean
}

function Card({
  className,
  hoverable,
  selected,
  padded = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)]',
        'bg-[hsl(var(--color-surface))]',
        'border border-[hsl(var(--color-border))]',
        padded && 'p-5',
        hoverable && [
          'cursor-pointer transition-all duration-150',
          'hover:border-[hsl(var(--color-border-2))]',
          'hover:bg-[hsl(var(--color-surface-2)/0.5)]',
        ],
        selected && [
          'border-[hsl(var(--color-accent)/0.5)]',
          'bg-[hsl(var(--color-accent)/0.04)]',
          'shadow-[0_0_0_1px_hsl(var(--color-accent)/0.2)]',
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

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}) {
  return (
    <Card padded>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[hsl(var(--color-text-3))] uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon && (
          <div className="p-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface-2))]">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-[hsl(var(--color-text-1))] leading-none mb-1">
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            'text-xs mt-1',
            trend === 'up' && 'text-[hsl(var(--color-success))]',
            trend === 'down' && 'text-[hsl(var(--color-danger))]',
            trend === 'neutral' && 'text-[hsl(var(--color-text-3))]',
            !trend && 'text-[hsl(var(--color-text-3))]'
          )}
        >
          {sub}
        </p>
      )}
    </Card>
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
