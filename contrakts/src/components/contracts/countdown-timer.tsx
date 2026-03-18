'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Timer, Zap } from 'lucide-react'

const AUTO_RELEASE_MS = 72 * 60 * 60 * 1000

interface CountdownTimerProps {
  submittedAt: string
  size?: 'sm' | 'md'
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  total: number
  pct: number
}

function calcTimeLeft(submittedAt: string): TimeLeft {
  const deadline = new Date(submittedAt).getTime() + AUTO_RELEASE_MS
  const diff = Math.max(0, deadline - Date.now())
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const elapsed = AUTO_RELEASE_MS - diff
  const pct = Math.min(100, (elapsed / AUTO_RELEASE_MS) * 100)

  return { hours, minutes, seconds, total: diff, pct }
}

export function CountdownTimer({
  submittedAt,
  size = 'md',
}: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(submittedAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calcTimeLeft(submittedAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [submittedAt])

  const isExpired = time.total === 0
  const isUrgent = time.total < 6 * 3600000

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.1)] px-3 py-2">
        <Zap size={13} className="text-[hsl(var(--color-success))]" />
        <span className="text-xs font-medium text-[hsl(var(--color-success))]">
          Auto-releasing payment...
        </span>
      </div>
    )
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1.5">
        <Timer
          size={11}
          className={
            isUrgent
              ? 'text-[hsl(var(--color-danger))]'
              : 'text-[hsl(var(--color-warning))]'
          }
        />
        <span
          className={cn(
            'text-[11px] font-medium tabular-nums',
            isUrgent
              ? 'text-[hsl(var(--color-danger))]'
              : 'text-[hsl(var(--color-warning))]'
          )}
        >
          {String(time.hours).padStart(2, '0')}:
          {String(time.minutes).padStart(2, '0')}:
          {String(time.seconds).padStart(2, '0')} auto-release
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border',
        isUrgent
          ? 'border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.05)]'
          : 'border-[hsl(var(--color-warning)/0.3)] bg-[hsl(var(--color-warning)/0.05)]'
      )}
    >
      <div className="h-1 overflow-hidden bg-[hsl(var(--color-border))]">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            isUrgent
              ? 'bg-[hsl(var(--color-danger))]'
              : 'bg-[hsl(var(--color-warning))]'
          )}
          style={{ width: `${time.pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Timer
            size={14}
            className={
              isUrgent
                ? 'text-[hsl(var(--color-danger))]'
                : 'text-[hsl(var(--color-warning))]'
            }
          />
          <div>
            <p
              className={cn(
                'text-xs font-medium',
                isUrgent
                  ? 'text-[hsl(var(--color-danger))]'
                  : 'text-[hsl(var(--color-warning))]'
              )}
            >
              Auto-release countdown
            </p>
            <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
              Payment releases automatically if not reviewed
            </p>
          </div>
        </div>
        <div
          className={cn(
            'text-right font-mono tabular-nums',
            isUrgent
              ? 'text-[hsl(var(--color-danger))]'
              : 'text-[hsl(var(--color-warning))]'
          )}
        >
          <p className="text-xl font-semibold">
            {String(time.hours).padStart(2, '0')}:
            {String(time.minutes).padStart(2, '0')}:
            {String(time.seconds).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-[hsl(var(--color-text-3))]">HH : MM : SS</p>
        </div>
      </div>
    </div>
  )
}
