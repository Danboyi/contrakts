'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface TrustScoreCircleProps {
  score: number
  size?: number
  className?: string
}

function getScoreColor(score: number): {
  stroke: string
  text: string
  label: string
} {
  if (score >= 90) {
    return {
      stroke: 'hsl(var(--color-success))',
      text: 'text-[hsl(var(--color-success))]',
      label: 'Excellent',
    }
  }

  if (score >= 75) {
    return {
      stroke: 'hsl(var(--color-accent))',
      text: 'text-[hsl(var(--color-accent))]',
      label: 'Good',
    }
  }

  if (score >= 50) {
    return {
      stroke: 'hsl(var(--color-warning))',
      text: 'text-[hsl(var(--color-warning))]',
      label: 'Fair',
    }
  }

  return {
    stroke: 'hsl(var(--color-danger))',
    text: 'text-[hsl(var(--color-danger))]',
    label: 'Poor',
  }
}

export function TrustScoreCircle({
  score,
  size = 120,
  className,
}: TrustScoreCircleProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnimated(true), 150)
    return () => window.clearTimeout(timeout)
  }, [])

  const safeScore = Math.max(0, Math.min(100, score))
  const { stroke, text, label } = getScoreColor(safeScore)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference - (animated ? safeScore / 100 : 0) * circumference

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--color-border))"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn('font-bold leading-none', text)}
          style={{ fontSize: size * 0.22 }}
        >
          {safeScore}
        </span>
        <span
          className="font-medium text-[hsl(var(--color-text-3))]"
          style={{ fontSize: size * 0.1 }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
