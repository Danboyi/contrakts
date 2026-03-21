import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  verified?: boolean
}

const sizeMap = {
  xs: { container: 'h-6 w-6 text-[10px]', ring: '-bottom-0.5 -right-0.5 h-2.5 w-2.5' },
  sm: { container: 'h-8 w-8 text-xs', ring: '-bottom-0.5 -right-0.5 h-3 w-3' },
  md: { container: 'h-10 w-10 text-sm', ring: '-bottom-0.5 -right-0.5 h-3.5 w-3.5' },
  lg: { container: 'h-12 w-12 text-base', ring: '-bottom-0 -right-0 h-4 w-4' },
  xl: { container: 'h-16 w-16 text-lg', ring: 'bottom-0 right-0 h-5 w-5' },
} as const

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-[hsl(var(--color-accent)/0.2)] text-[hsl(var(--color-accent))]',
    'bg-[hsl(var(--color-success)/0.15)] text-[hsl(var(--color-success))]',
    'bg-[hsl(var(--color-warning)/0.15)] text-[hsl(var(--color-warning))]',
    'bg-[hsl(var(--color-danger)/0.15)] text-[hsl(var(--color-danger))]',
    'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))]',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  verified,
}: AvatarProps) {
  const { container, ring } = sizeMap[size]

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full font-semibold',
          container,
          !src && getColorFromName(name)
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {verified && (
        <div
          className={cn(
            'absolute rounded-full border-2 border-[hsl(var(--color-bg))]',
            'bg-[hsl(var(--color-gold))]',
            ring
          )}
        />
      )}
    </div>
  )
}

export function PartyAvatars({
  initiator,
  counterparty,
}: {
  initiator: { name: string; src?: string | null }
  counterparty: { name: string; src?: string | null } | null
}) {
  return (
    <div className="flex items-center">
      <Avatar name={initiator.name} src={initiator.src} size="sm" />
      {counterparty && (
        <Avatar
          name={counterparty.name}
          src={counterparty.src}
          size="sm"
          className="-ml-2 ring-2 ring-[hsl(var(--color-surface))]"
        />
      )}
    </div>
  )
}
