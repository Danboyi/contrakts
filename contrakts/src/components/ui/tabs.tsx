'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils/cn'

const Tabs = TabsPrimitive.Root
const TabsPanel = TabsPrimitive.Content

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
      'bg-[hsl(var(--color-surface))] p-1',
      className
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center gap-1.5 rounded-[calc(var(--radius-md)-2px)] px-3 text-sm font-medium',
      'cursor-pointer text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
      'hover:text-[hsl(var(--color-text-2))]',
      'data-[state=active]:bg-[hsl(var(--color-surface-2))]',
      'data-[state=active]:text-[hsl(var(--color-text-1))]',
      'data-[state=active]:shadow-sm',
      'focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

export { Tabs, TabsList, TabsTrigger, TabsPanel }
