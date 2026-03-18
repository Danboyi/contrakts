'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils/cn'

export function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 300,
}: {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              'z-50 select-none rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface-2))] px-2.5 py-1.5',
              'text-xs text-[hsl(var(--color-text-1))]',
              'shadow-[0_4px_12px_hsl(0_0%_0%/0.3)]',
              'animate-fade-in'
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[hsl(var(--color-border))]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
