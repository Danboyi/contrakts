'use client'

import { cn } from '@/lib/utils/cn'

interface AnimatedCheckmarkProps {
  variant?: 'success' | 'accent'
  size?: 'sm' | 'md'
  className?: string
}

const SIZES = {
  sm: 24,
  md: 40,
} as const

const COLORS = {
  success: 'hsl(var(--color-success))',
  accent: 'hsl(var(--color-accent))',
} as const

export function AnimatedCheckmark({
  variant = 'success',
  size = 'md',
  className,
}: AnimatedCheckmarkProps) {
  const px = SIZES[size]
  const color = COLORS[variant]
  const strokeWidth = size === 'sm' ? 2.5 : 3
  const r = px / 2 - strokeWidth
  const circumference = 2 * Math.PI * r
  const center = px / 2

  // Checkmark path scaled to the circle
  const checkScale = r * 0.55
  const checkX = center - checkScale * 0.65
  const checkMidX = center - checkScale * 0.1
  const checkMidY = center + checkScale * 0.4
  const checkEndX = center + checkScale * 0.65
  const checkEndY = center - checkScale * 0.35
  const checkStartY = center + checkScale * 0.05

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={cn('animated-checkmark', className)}
    >
      <style>{`
        .animated-checkmark .ac-circle {
          stroke-dasharray: ${circumference};
          stroke-dashoffset: ${circumference};
          animation: ac-draw-circle 0.4s ease-out 0.1s forwards;
        }
        .animated-checkmark .ac-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: ac-draw-check 0.35s ease-out 0.45s forwards;
        }
        @keyframes ac-draw-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes ac-draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <circle
        className="ac-circle"
        cx={center}
        cy={center}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        className="ac-check"
        d={`M${checkX} ${checkStartY} L${checkMidX} ${checkMidY} L${checkEndX} ${checkEndY}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
