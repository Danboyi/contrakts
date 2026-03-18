import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 14, md: 20, lg: 32 } as const

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={cn('animate-spin text-[hsl(var(--color-text-3))]', className)}
    />
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--color-bg))]">
      <div className="flex flex-col items-center gap-4">
        <span className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
          Contrakts
        </span>
        <Spinner size="md" />
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse-soft rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))]',
        className
      )}
    />
  )
}

export function ContractCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
