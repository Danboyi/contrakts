'use client'

import Link from 'next/link'
import { Bell, Menu } from 'lucide-react'
import { useSidebar } from '@/lib/context/sidebar-context'
import { cn } from '@/lib/utils/cn'

export function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-bg)/0.92)] px-4 backdrop-blur-xl lg:hidden'
      )}
    >
      <button
        type="button"
        onClick={open}
        className={cn(
          'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] p-2 -ml-2',
          'text-[hsl(var(--color-text-2))] transition-all duration-150',
          'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
        )}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <Link href="/dashboard" className="flex items-center gap-2">
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full',
            'bg-[hsl(var(--color-accent))]'
          )}
        />
        <span className="text-sm font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
          Contrakts
        </span>
      </Link>

      <Link
        href="/notifications"
        className={cn(
          'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] p-2 -mr-2',
          'text-[hsl(var(--color-text-2))] transition-all duration-150',
          'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
        )}
        aria-label="Notifications"
      >
        <Bell size={18} />
      </Link>
    </header>
  )
}
