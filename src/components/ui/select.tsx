'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Select…',
  options,
  label,
  error,
  disabled,
  className,
}: SelectProps) {
  const id = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="select-none text-xs font-medium text-[hsl(var(--color-text-2))]"
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'flex h-[44px] w-full items-center justify-between rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] px-4 text-sm text-[hsl(var(--color-text-1))] outline-none',
            'transition-all duration-150',
            'focus:border-[hsl(var(--color-accent))]',
            'focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'data-[placeholder]:text-[hsl(var(--color-text-3))]',
            error && 'border-[hsl(var(--color-danger))]',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown size={15} className="text-[hsl(var(--color-text-3))]" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface-2))] p-1',
              'shadow-[0_8px_24px_hsl(0_0%_0%/0.4)] animate-scale-in'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] px-2.5 py-2 pr-8 text-sm outline-none',
                    'text-[hsl(var(--color-text-2))] transition-colors duration-100',
                    'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]',
                    'focus:bg-[hsl(var(--color-surface))] focus:text-[hsl(var(--color-text-1))]',
                    'data-[state=checked]:text-[hsl(var(--color-text-1))]'
                  )}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                    <Check size={13} className="text-[hsl(var(--color-accent))]" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-xs text-[hsl(var(--color-danger))]">{error}</p>}
    </div>
  )
}
