'use client'

import { cn } from '@/lib/utils/cn'

interface PreviewToolbarProps {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

export function PreviewToolbar({
  left,
  center,
  right,
  className,
}: PreviewToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface-2)/0.5)] px-3 py-2',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      {center ? (
        <div className="hidden shrink-0 items-center gap-0.5 sm:flex">{center}</div>
      ) : null}
      <div className="flex shrink-0 items-center gap-0.5">{right}</div>
    </div>
  )
}
