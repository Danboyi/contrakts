'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils/cn'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownTrigger = DropdownMenuPrimitive.Trigger

const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface-2))] p-1',
        'shadow-[0_8px_24px_hsl(0_0%_0%/0.4)]',
        'data-[state=open]:animate-scale-in',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownContent.displayName = 'DropdownContent'

const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
    danger?: boolean
    leftIcon?: React.ReactNode
    rightSlot?: React.ReactNode
  }
>(({ className, inset, danger, leftIcon, rightSlot, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm outline-none',
      'text-[hsl(var(--color-text-2))] transition-colors duration-100',
      'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]',
      'focus:bg-[hsl(var(--color-surface))] focus:text-[hsl(var(--color-text-1))]',
      danger &&
        'text-[hsl(var(--color-danger))] hover:bg-[hsl(var(--color-danger)/0.1)] focus:bg-[hsl(var(--color-danger)/0.1)]',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {leftIcon && <span className="shrink-0 opacity-60">{leftIcon}</span>}
    <span className="flex-1">{children}</span>
    {rightSlot && (
      <span className="ml-auto text-xs text-[hsl(var(--color-text-3))]">
        {rightSlot}
      </span>
    )}
  </DropdownMenuPrimitive.Item>
))
DropdownItem.displayName = 'DropdownItem'

const DropdownSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-[hsl(var(--color-border))]', className)}
    {...props}
  />
))
DropdownSeparator.displayName = 'DropdownSeparator'

const DropdownLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]',
      className
    )}
    {...props}
  />
))
DropdownLabel.displayName = 'DropdownLabel'

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
}
