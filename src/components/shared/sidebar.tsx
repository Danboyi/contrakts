'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ElementType, useCallback, useEffect, useState } from 'react'
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logout } from '@/lib/auth/actions'
import { useUser } from '@/hooks/use-user'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { TrustScore } from '@/components/ui/trust-score'
import type { User as UserType } from '@/types'

export const SIDEBAR_WIDTH = 240
export const SIDEBAR_COLLAPSED_WIDTH = 64

const STORAGE_KEY = 'contrakts_sidebar_collapsed'

interface NavItem {
  label: string
  href: string
  icon: ElementType
  disabled?: boolean
}

const workspaceNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Contracts', href: '/contracts', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Templates', href: '/templates', icon: LayoutTemplate },
]

const accountNav: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Developers', href: '/developers', icon: Code2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const classes = cn(
    'group flex items-center rounded-[var(--radius-md)] text-sm outline-none transition-all duration-150',
    'focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]',
    collapsed ? 'mx-1.5 justify-center px-0 py-2.5' : 'mx-2 gap-3 px-3 py-2.5',
    active &&
      !item.disabled &&
      'border-r-2 border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.1)] font-medium text-[hsl(var(--color-accent))]',
    !active &&
      !item.disabled &&
      'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]',
    item.disabled &&
      'cursor-not-allowed text-[hsl(var(--color-text-3))] opacity-50'
  )

  const icon = (
    <item.icon
      size={collapsed ? 18 : 16}
      className={cn(
        'shrink-0 transition-colors duration-150',
        active && !item.disabled && 'text-[hsl(var(--color-accent))]',
        !active &&
          !item.disabled &&
          'text-[hsl(var(--color-text-3))] group-hover:text-[hsl(var(--color-text-2))]',
        item.disabled && 'text-[hsl(var(--color-text-3))]'
      )}
    />
  )

  const content = collapsed ? (
    icon
  ) : (
    <>
      {icon}
      <span className="truncate">{item.label}</span>
      {item.disabled && (
        <span
          className={cn(
            'ml-auto rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]',
            'px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--color-text-3))]'
          )}
        >
          Soon
        </span>
      )}
    </>
  )

  const tooltipContent = item.disabled ? 'Coming soon' : item.label

  if (item.disabled) {
    return (
      <Tooltip content={tooltipContent} side="right">
        <div className={classes}>{content}</div>
      </Tooltip>
    )
  }

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        <Link href={item.href} onClick={onNavigate} className={classes}>
          {content}
        </Link>
      </Tooltip>
    )
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={classes}>
      {content}
    </Link>
  )
}

export function Sidebar({
  profile,
  onClose,
  onCollapsedChange,
}: {
  profile: UserType
  onClose?: () => void
  onCollapsedChange?: (collapsed: boolean) => void
}) {
  const pathname = usePathname()
  const { user: liveUser } = useUser()
  const activeProfile = liveUser ?? profile

  const [collapsed, setCollapsed] = useState(false)

  // Hydrate collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setCollapsed(true)
        onCollapsedChange?.(true)
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      onCollapsedChange?.(next)
      return next
    })
  }, [onCollapsedChange])

  return (
    <div className="flex h-full flex-col py-4">
      {/* Logo */}
      <div
        className={cn(
          'mb-6 flex h-8 items-center gap-2',
          collapsed ? 'justify-center px-0' : 'px-5'
        )}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--color-accent))]" />
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
            Contrakts
          </span>
        )}
      </div>

      {/* Workspace nav */}
      <div className="mb-4">
        {!collapsed && (
          <p className="mb-2 px-5 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
            Workspace
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {workspaceNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              }
              onNavigate={onClose}
            />
          ))}
        </nav>
      </div>

      <div
        className={cn(
          'my-2 h-px bg-[hsl(var(--color-border))]',
          collapsed ? 'mx-3' : 'mx-5'
        )}
      />

      {/* Account nav */}
      <div>
        {!collapsed && (
          <p className="mb-2 px-5 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
            Account
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {accountNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname.startsWith(item.href)}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Collapse toggle */}
      <div className={cn('mb-3', collapsed ? 'px-2' : 'px-3')}>
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'flex w-full items-center rounded-[var(--radius-md)] py-2 text-xs',
              'text-[hsl(var(--color-text-3))] transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]',
              collapsed ? 'justify-center px-0' : 'gap-2 px-2.5'
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </Tooltip>
      </div>

      {/* User card */}
      {collapsed ? (
        <div className="flex justify-center px-2">
          <Tooltip
            content={
              <div className="flex flex-col gap-1">
                <span className="font-medium">{activeProfile.full_name}</span>
                <TrustScore score={activeProfile.trust_score} size="sm" />
              </div>
            }
            side="right"
          >
            <Link href="/profile" className="block">
              <Avatar
                name={activeProfile.full_name}
                src={activeProfile.avatar_url}
                size="sm"
              />
            </Link>
          </Tooltip>
        </div>
      ) : (
        <div
          className={cn(
            'mx-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] p-3'
          )}
        >
          <div className="mb-3 flex items-center gap-3">
            <Avatar
              name={activeProfile.full_name}
              src={activeProfile.avatar_url}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <Link
                href="/profile"
                className="block truncate text-sm font-medium text-[hsl(var(--color-text-1))] transition-colors hover:text-[hsl(var(--color-accent))]"
              >
                {activeProfile.full_name}
              </Link>
              <Link href="/profile#overview" className="inline-flex">
                <TrustScore score={activeProfile.trust_score} size="sm" />
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs',
              'text-[hsl(var(--color-text-3))] transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-danger))]'
            )}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
