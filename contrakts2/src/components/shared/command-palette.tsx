'use client'

import { useState, useEffect, useCallback, useRef, type ElementType, type KeyboardEvent as ReactKeyboardEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Bell,
  Code2,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
  Search,
  Settings,
  User,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CommandItem {
  id: string
  label: string
  icon: ElementType
  href: string
  group: string
  keywords?: string[]
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Navigate', keywords: ['home'] },
  { id: 'contracts', label: 'Go to Contracts', icon: FileText, href: '/contracts', group: 'Navigate', keywords: ['deals'] },
  { id: 'notifications', label: 'Go to Notifications', icon: Bell, href: '/notifications', group: 'Navigate', keywords: ['alerts', 'inbox'] },
  { id: 'templates', label: 'Go to Templates', icon: LayoutTemplate, href: '/templates', group: 'Navigate', keywords: ['reuse'] },
  { id: 'profile', label: 'Go to Profile', icon: User, href: '/profile', group: 'Navigate', keywords: ['account'] },
  { id: 'settings', label: 'Go to Settings', icon: Settings, href: '/settings', group: 'Navigate', keywords: ['preferences'] },
  { id: 'developers', label: 'Go to Developers', icon: Code2, href: '/developers', group: 'Navigate', keywords: ['api'] },
  // Actions
  { id: 'new-contract', label: 'Create new contract', icon: Plus, href: '/contracts/new', group: 'Actions', keywords: ['new', 'create', 'draft'] },
  { id: 'new-template', label: 'Create new template', icon: Plus, href: '/templates/new', group: 'Actions', keywords: ['new', 'create'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Listen for Cmd+K / Ctrl+K and "/" key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev: boolean) => !prev)
      }
      if (e.key === '/' && !open) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Filter commands by query
  const filtered = query.trim()
    ? COMMANDS.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.group.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        )
      })
    : COMMANDS

  // Group filtered items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const flatList = Object.values(groups).flat()

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false)
      setQuery('')
      router.push(item.href)
    },
    [router]
  )

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  function handleKeyDown(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i: number) => (i + 1) % flatList.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i: number) => (i - 1 + flatList.length) % flatList.length)
    } else if (e.key === 'Enter' && flatList[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatList[selectedIndex])
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in data-[state=closed]:opacity-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-[20%] z-[100] w-full max-w-[520px] -translate-x-1/2',
            'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] shadow-modal',
            'data-[state=open]:animate-scale-in'
          )}
          onKeyDown={handleKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search commands and navigate quickly
          </DialogPrimitive.Description>

          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[hsl(var(--color-border))] px-4">
            <Search size={16} className="shrink-0 text-[hsl(var(--color-text-3))]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              className="h-12 flex-1 bg-transparent text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))]"
              autoFocus
            />
            <kbd className="hidden shrink-0 rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1.5 py-0.5 font-mono text-2xs text-[hsl(var(--color-text-3))] sm:block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[hsl(var(--color-text-3))]">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-2 text-2xs font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
                    {group}
                  </p>
                  {items.map((item) => {
                    const globalIndex = flatList.indexOf(item)
                    const isSelected = globalIndex === selectedIndex
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-100',
                          isSelected
                            ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                            : 'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface-2))]'
                        )}
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isSelected && (
                          <ArrowRight size={13} className="shrink-0 opacity-60" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-[hsl(var(--color-border))] px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-2xs text-[hsl(var(--color-text-3))]">
              <kbd className="rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1 py-0.5 font-mono">↑↓</kbd>
              Navigate
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-[hsl(var(--color-text-3))]">
              <kbd className="rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1 py-0.5 font-mono">↵</kbd>
              Select
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
