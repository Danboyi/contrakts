import { cn } from '@/lib/utils/cn'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

export function Separator({
  orientation = 'horizontal',
  label,
  className,
}: SeparatorProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="h-px flex-1 bg-[hsl(var(--color-border))]" />
        <span className="whitespace-nowrap text-xs text-[hsl(var(--color-text-3))]">
          {label}
        </span>
        <div className="h-px flex-1 bg-[hsl(var(--color-border))]" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        orientation === 'horizontal'
          ? 'h-px w-full bg-[hsl(var(--color-border))]'
          : 'h-full w-px bg-[hsl(var(--color-border))]',
        className
      )}
    />
  )
}
