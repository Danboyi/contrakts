'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface NavResult {
  kind: 'navigation'
  id: string
  label: string
  href: string
  icon: React.ElementType
}

interface ContractResult {
  kind: 'contract'
  id: string
  title: string
  ref_code: string | null
  state: string | null
}

interface UserResult {
  kind: 'user'
  id: string
  full_name: string
  email: string | null
  avatar_url: string | null
}

type PaletteItem = NavResult | ContractResult | UserResult

/* -------------------------------------------------------------------------- */
/*  Static navigation items                                                   */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: NavResult[] = [
  { kind: 'navigation', id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { kind: 'navigation', id: 'nav-contracts', label: 'Contracts', href: '/contracts', icon: FileText },
  { kind: 'navigation', id: 'nav-notifications', label: 'Notifications', href: '/notifications', icon: Bell },
  { kind: 'navigation', id: 'nav-templates', label: 'Templates', href: '/templates', icon: LayoutTemplate },
  { kind: 'navigation', id: 'nav-profile', label: 'Profile', href: '/profile', icon: User },
  { kind: 'navigation', id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function itemId(item: PaletteItem): string {
  if (item.kind === 'navigation') return item.id
  return `${item.kind}-${item.id}`
}

function itemLabel(item: PaletteItem): string {
  if (item.kind === 'navigation') return item.label
  if (item.kind === 'contract') return item.title
  return item.full_name
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function CommandPalette() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [contracts, setContracts] = useState<ContractResult[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)

  /* ------ Open / close with Cmd+K / Ctrl+K ------------------------------ */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  /* ------ Focus input when opened --------------------------------------- */

  useEffect(() => {
    if (open) {
      setQuery('')
      setContracts([])
      setUsers([])
      setActiveIndex(0)
      // Small delay to let framer-motion render the input first
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  /* ------ Debounced Supabase search ------------------------------------- */

  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setContracts([])
      setUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()

      const [contractsRes, usersRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('id, title, ref_code, state')
          .ilike('title', `%${trimmed}%`)
          .limit(5),
        supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .ilike('full_name', `%${trimmed}%`)
          .limit(5),
      ])

      setContracts(
        (contractsRes.data ?? []).map((c) => ({ kind: 'contract' as const, ...c }))
      )
      setUsers(
        (usersRes.data ?? []).map((u) => ({ kind: 'user' as const, ...u }))
      )
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, open])

  /* ------ Build flat list of items grouped by section -------------------- */

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return NAV_ITEMS
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q))
  }, [query])

  const allItems: PaletteItem[] = useMemo(
    () => [...filteredNav, ...contracts, ...users],
    [filteredNav, contracts, users]
  )

  /* Reset active index when results change */
  useEffect(() => {
    setActiveIndex(0)
  }, [allItems.length])

  /* ------ Navigation handler -------------------------------------------- */

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      setOpen(false)
      if (item.kind === 'navigation') {
        router.push(item.href)
      } else if (item.kind === 'contract') {
        router.push(`/contracts/${item.id}`)
      } else {
        router.push(`/profile/${item.id}`)
      }
    },
    [router]
  )

  /* ------ Keyboard navigation ------------------------------------------- */

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % allItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[activeIndex]) {
        handleSelect(allItems[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  /* ------ Scroll active item into view ---------------------------------- */

  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  /* ------ Section rendering helpers ------------------------------------- */

  function renderSectionHeading(label: string) {
    return (
      <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
        {label}
      </p>
    )
  }

  function renderItem(item: PaletteItem, index: number) {
    const active = index === activeIndex
    const id = itemId(item)

    const base = cn(
      'mx-1.5 flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors duration-100',
      active
        ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
        : 'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface-2))]'
    )

    let icon: React.ReactNode = null
    let label: React.ReactNode = null
    let meta: React.ReactNode = null

    if (item.kind === 'navigation') {
      const Icon = item.icon
      icon = <Icon size={16} className="shrink-0" />
      label = <span className="truncate">{item.label}</span>
    } else if (item.kind === 'contract') {
      icon = <FileText size={16} className="shrink-0" />
      label = <span className="truncate">{item.title}</span>
      meta = item.ref_code ? (
        <span className="ml-auto shrink-0 text-xs text-[hsl(var(--color-text-3))]">
          {item.ref_code}
        </span>
      ) : null
    } else {
      icon = <Users size={16} className="shrink-0" />
      label = <span className="truncate">{item.full_name}</span>
      meta = item.email ? (
        <span className="ml-auto shrink-0 truncate text-xs text-[hsl(var(--color-text-3))]">
          {item.email}
        </span>
      ) : null
    }

    return (
      <div
        key={id}
        role="option"
        aria-selected={active}
        data-active={active}
        className={base}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => handleSelect(item)}
      >
        {icon}
        {label}
        {meta}
      </div>
    )
  }

  /* ------ Figure out per-section slices --------------------------------- */

  let runningIndex = 0

  const navSection = filteredNav.length > 0 && (
    <div key="section-nav">
      {renderSectionHeading('Navigation')}
      {filteredNav.map((item) => {
        const idx = runningIndex++
        return renderItem(item, idx)
      })}
    </div>
  )

  const contractSection = contracts.length > 0 && (
    <div key="section-contracts">
      {renderSectionHeading('Contracts')}
      {contracts.map((item) => {
        const idx = runningIndex++
        return renderItem(item, idx)
      })}
    </div>
  )

  const userSection = users.length > 0 && (
    <div key="section-users">
      {renderSectionHeading('Users')}
      {users.map((item) => {
        const idx = runningIndex++
        return renderItem(item, idx)
      })}
    </div>
  )

  /* ------ Render -------------------------------------------------------- */

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Palette */}
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)]',
              'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
              'shadow-2xl'
            )}
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-[hsl(var(--color-border))] px-4 py-3">
              <Search
                size={18}
                className="shrink-0 text-[hsl(var(--color-text-3))]"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, contracts, users…"
                className={cn(
                  'flex-1 bg-transparent text-sm text-[hsl(var(--color-text-1))] outline-none',
                  'placeholder:text-[hsl(var(--color-text-3))]'
                )}
                aria-autocomplete="list"
                aria-controls="command-palette-list"
              />
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--color-border))] border-t-[hsl(var(--color-accent))]" />
              )}
              <kbd
                className={cn(
                  'hidden shrink-0 rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]',
                  'bg-[hsl(var(--color-surface-2))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--color-text-3))]',
                  'sm:inline-block'
                )}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              id="command-palette-list"
              role="listbox"
              aria-label="Results"
              className="max-h-[360px] overflow-y-auto overscroll-contain py-1.5"
            >
              {allItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[hsl(var(--color-text-3))]">
                  {query.trim().length > 0 ? 'No results found.' : 'Start typing to search…'}
                </p>
              ) : (
                <>
                  {navSection}
                  {contractSection}
                  {userSection}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 border-t border-[hsl(var(--color-border))] px-4 py-2">
              <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--color-text-3))]">
                <kbd className="rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1 py-0.5 font-mono text-[10px]">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--color-text-3))]">
                <kbd className="rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1 py-0.5 font-mono text-[10px]">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--color-text-3))]">
                <kbd className="rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1 py-0.5 font-mono text-[10px]">
                  esc
                </kbd>
                Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
