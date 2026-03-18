import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TrustScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

function getScoreVariant(score: number): {
  color: string
  bg: string
  label: string
} {
  if (score >= 90) {
    return {
      color: 'text-[hsl(var(--color-success))]',
      bg: 'bg-[hsl(var(--color-success)/0.1)]',
      label: 'Excellent',
    }
  }

  if (score >= 75) {
    return {
      color: 'text-[hsl(var(--color-accent))]',
      bg: 'bg-[hsl(var(--color-accent)/0.1)]',
      label: 'Good',
    }
  }

  if (score >= 50) {
    return {
      color: 'text-[hsl(var(--color-warning))]',
      bg: 'bg-[hsl(var(--color-warning)/0.1)]',
      label: 'Fair',
    }
  }

  return {
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: 'Poor',
  }
}

export function TrustScore({
  score,
  size = 'md',
  showLabel,
  className,
}: TrustScoreProps) {
  const { color, bg, label } = getScoreVariant(score)

  if (size === 'sm') {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <Shield size={11} className={color} />
        <span className={cn('text-xs font-semibold', color)}>{score}</span>
      </span>
    )
  }

  if (size === 'lg') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <div className={cn('rounded-full p-3', bg)}>
          <Shield size={24} className={color} />
        </div>
        <span className={cn('text-3xl font-semibold', color)}>{score}</span>
        {showLabel && (
          <span className="text-xs text-[hsl(var(--color-text-3))]">
            {label} trust score
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-1.5',
        bg,
        className
      )}
    >
      <Shield size={14} className={color} />
      <span className={cn('text-sm font-semibold', color)}>{score}</span>
      {showLabel && (
        <span className="text-xs text-[hsl(var(--color-text-3))]">{label}</span>
      )}
    </div>
  )
}
