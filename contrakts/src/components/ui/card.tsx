'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
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

// --- Animated number counter ---
function useAnimatedNumber(target: number, duration = 900) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) {
      setDisplay(0)
      return
    }
    startRef.current = null
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return display
}

// --- Sparkline SVG ---
function Sparkline({
  data,
  color = 'hsl(var(--color-accent))',
  height = 28,
  width = 64,
}: {
  data: number[]
  color?: string
  height?: number
  width?: number
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data
    .map(
      (v, i) =>
        `${i * stepX},${height - ((v - min) / range) * (height * 0.8) - height * 0.1}`
    )
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="opacity-60"
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon,
  sparkline,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  sparkline?: number[]
}) {
  // Animate numeric values
  const isNumeric = typeof value === 'number'
  const animated = useAnimatedNumber(isNumeric ? (value as number) : 0)
  const displayValue = isNumeric ? animated : value

  const sparkColor =
    trend === 'up'
      ? 'hsl(var(--color-success))'
      : trend === 'down'
        ? 'hsl(var(--color-danger))'
        : 'hsl(var(--color-accent))'

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
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-[hsl(var(--color-text-1))] leading-none mb-1">
            {displayValue}
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
        </div>
        {sparkline && sparkline.length >= 2 && (
          <Sparkline data={sparkline} color={sparkColor} />
        )}
      </div>
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
