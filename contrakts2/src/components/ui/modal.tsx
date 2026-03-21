'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  hideClose,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
            'data-[state=closed]:animate-fade-out'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50',
            '-translate-x-1/2 -translate-y-1/2',
            'w-full max-w-[calc(100vw-2rem)]',
            sizeMap[size],
            'rounded-[var(--radius-xl)]',
            'bg-[hsl(var(--color-surface-2))]',
            'border border-[hsl(var(--color-border))]',
            'shadow-[0_25px_50px_hsl(0_0%_0%/0.5)]',
            'p-6 outline-none',
            'data-[state=open]:animate-scale-in'
          )}
        >
          {(title || !hideClose) && (
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {title && (
                  <Dialog.Title className="text-lg font-semibold leading-tight text-[hsl(var(--color-text-1))]">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-[hsl(var(--color-text-2))]">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {!hideClose && (
                <Dialog.Close
                  className={cn(
                    'rounded-[var(--radius-sm)] p-1.5',
                    'text-[hsl(var(--color-text-3))]',
                    'transition-all duration-150 outline-none',
                    'hover:bg-[hsl(var(--color-surface))]',
                    'hover:text-[hsl(var(--color-text-1))]',
                    'focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]'
                  )}
                >
                  <X size={16} />
                </Dialog.Close>
              )}
            </div>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-end gap-3 border-t border-[hsl(var(--color-border))] pt-5',
        className
      )}
      {...props}
    />
  )
}
