'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ElementType } from 'react'
import {
  Bell,
  Code2,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  Shield,
  User,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logout } from '@/lib/auth/actions'
import { useUser } from '@/hooks/use-user'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { TrustScore } from '@/components/ui/trust-score'
import type { User as UserType } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: ElementType
  disabled?: boolean
  badge?: number
  shortcut?: string
}

const workspaceNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { label: 'Contracts', href: '/contracts', icon: FileText, shortcut: 'C' },
  { label: 'Notifications', href: '/notifications', icon: Bell, shortcut: 'N' },
  { label: 'Templates', href: '/templates', icon: LayoutTemplate, shortcut: 'T' },
]

const accountNav: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Developers', href: '/developers', icon: Code2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  const classes = cn(
    'group mx-2 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]',
    active &&
      !item.disabled && [
        'bg-[hsl(var(--color-accent)/0.1)] font-medium text-[hsl(var(--color-accent))]',
        'border-l-2 border-[hsl(var(--color-accent))]',
        'shadow-[inset_0_0_20px_hsl(var(--color-accent)/0.05)]',
      ],
    !active &&
      !item.disabled &&
      'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]',
    item.disabled &&
      'cursor-not-allowed text-[hsl(var(--color-text-3))] opacity-50'
  )

  const icon = (
    <item.icon
      size={16}
      className={cn(
        'shrink-0 transition-colors duration-200',
        active && !item.disabled && 'text-[hsl(var(--color-accent))]',
        !active &&
          !item.disabled &&
          'text-[hsl(var(--color-text-3))] group-hover:text-[hsl(var(--color-text-2))]',
        item.disabled && 'text-[hsl(var(--color-text-3))]'
      )}
    />
  )

  const content = (
    <>
      {icon}
      <span className="truncate">{item.label}</span>
      {item.disabled && (
        <span className="ml-auto rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1.5 py-0.5 text-2xs font-medium text-[hsl(var(--color-text-3))]">
          Soon
        </span>
      )}
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--color-accent))] px-1.5 text-2xs font-bold text-white">
          {item.badge}
        </span>
      )}
      {item.shortcut && !item.disabled && !active && (
        <span className="ml-auto hidden rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-1.5 py-0.5 font-mono text-2xs text-[hsl(var(--color-text-3))] lg:block">
          {item.shortcut}
        </span>
      )}
    </>
  )

  if (item.disabled) {
    return (
      <Tooltip content="Coming soon" side="right">
        <div className={classes}>{content}</div>
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
}: {
  profile: UserType
  onClose?: () => void
}) {
  const pathname = usePathname()
  const { user: liveUser } = useUser()
  const activeProfile = liveUser ?? profile

  return (
    <div className="flex h-full flex-col py-4">
      {/* Logo */}
      <div className="mb-6 flex h-8 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))]">
          <Shield size={13} className="text-white" />
        </div>
        <span className="text-md font-bold tracking-tight text-[hsl(var(--color-text-1))]">
          Contrakts
        </span>
      </div>

      {/* Quick search hint — opens command palette */}
      <div className="mx-3 mb-4">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-2 text-[hsl(var(--color-text-3))] transition-colors hover:border-[hsl(var(--color-border-2))] hover:text-[hsl(var(--color-text-2))] cursor-pointer"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search...</span>
          <kbd className="hidden rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-1.5 py-0.5 font-mono text-2xs text-[hsl(var(--color-text-3))] lg:block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Workspace nav */}
      <div className="mb-4">
        <p className="mb-2 px-5 text-2xs font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
          Workspace
        </p>
        <nav className="flex flex-col gap-0.5">
          {workspaceNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
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

      <div className="mx-5 my-2 h-px bg-[hsl(var(--color-border))]" />

      {/* Account nav */}
      <div>
        <p className="mb-2 px-5 text-2xs font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
          Account
        </p>
        <nav className="flex flex-col gap-0.5">
          {accountNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      {/* User card */}
      <div className="mx-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3 transition-colors hover:border-[hsl(var(--color-border-2))]">
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
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs text-[hsl(var(--color-text-3))] transition-all duration-200 hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-danger))]"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  )
}
