'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logout } from '@/lib/auth/actions'
import { useUser } from '@/hooks/use-user'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { TrustScore } from '@/components/ui/trust-score'
import { NotificationBell } from './notification-bell'
import type { User } from '@/types'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contracts': 'Contracts',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/templates': 'Templates',
  '/developers': 'Developers',
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) {
    return (
      <div>
        <p className="text-2xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--color-text-3))]">
          Workspace
        </p>
        <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
          {breadcrumbMap[pathname] ?? 'Dashboard'}
        </h2>
      </div>
    )
  }

  const crumbs = segments.map((segment, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = breadcrumbMap[href] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5">
      {crumbs.map((crumb, i) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight size={12} className="text-[hsl(var(--color-text-3))]" />
          )}
          {crumb.isLast ? (
            <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-sm text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-text-2))]"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

function UserMenu({ profile }: { profile: User }) {
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] px-2 py-1.5',
            'text-[hsl(var(--color-text-1))] transition-all duration-200',
            'hover:bg-[hsl(var(--color-surface-2))] hover:border-[hsl(var(--color-border-2))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]'
          )}
        >
          <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
          <div className="hidden min-w-0 text-left md:block">
            <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
              {profile.full_name}
            </p>
            <p className="truncate text-2xs text-[hsl(var(--color-text-3))]">
              {profile.email}
            </p>
          </div>
          <ChevronDown size={14} className="text-[hsl(var(--color-text-3))]" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[260px]">
        <DropdownLabel className="normal-case tracking-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar
              name={profile.full_name}
              src={profile.avatar_url}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                {profile.full_name}
              </p>
              <p className="truncate text-xs text-[hsl(var(--color-text-3))]">
                {profile.email}
              </p>
              <TrustScore
                score={profile.trust_score}
                size="sm"
                className="mt-1"
              />
            </div>
          </div>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild leftIcon={<LayoutDashboard size={14} />}>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownItem>
        <DropdownItem asChild leftIcon={<UserIcon size={14} />}>
          <Link href="/profile">Profile</Link>
        </DropdownItem>
        <DropdownItem asChild leftIcon={<Settings size={14} />}>
          <Link href="/settings">Settings</Link>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          danger
          leftIcon={<LogOut size={14} />}
          onSelect={(event) => {
            event.preventDefault()
            void logout()
          }}
        >
          Sign out
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  )
}

export function Header({
  profile,
  onMenuClick,
}: {
  profile: User
  onMenuClick: () => void
}) {
  const { user: liveUser } = useUser()
  const activeProfile = liveUser ?? profile

  return (
    <>
      {/* Mobile header */}
      <div
        className={cn(
          'sticky top-0 z-30 -mx-6 flex h-14 items-center justify-between border-b border-[hsl(var(--color-border))]',
          'glass px-4 md:hidden'
        )}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[hsl(var(--color-text-2))] transition-colors duration-200 hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--color-accent))]">
            <Shield size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[hsl(var(--color-text-1))]">
            Contrakts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu profile={activeProfile} />
        </div>
      </div>

      {/* Desktop header */}
      <div className="sticky top-0 z-20 hidden h-14 items-center justify-between md:flex">
        <Breadcrumbs />
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserMenu profile={activeProfile} />
        </div>
      </div>
    </>
  )
}
