'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
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
import ThemeToggle from './theme-toggle'
import type { User } from '@/types'

function getSectionTitle(pathname: string) {
  if (pathname.startsWith('/contracts')) return 'Contracts'
  if (pathname.startsWith('/notifications')) return 'Notifications'
  if (pathname.startsWith('/profile')) return 'Profile'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Dashboard'
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
            'text-[hsl(var(--color-text-1))] transition-all duration-150',
            'hover:bg-[hsl(var(--color-surface-2))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]'
          )}
        >
          <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
          <div className="hidden min-w-0 text-left md:block">
            <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
              {profile.full_name}
            </p>
            <p className="truncate text-[11px] text-[hsl(var(--color-text-3))]">
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
        <Link href="/dashboard">
          <DropdownItem leftIcon={<LayoutDashboard size={14} />}>
            Dashboard
          </DropdownItem>
        </Link>
        <Link href="/profile">
          <DropdownItem leftIcon={<UserIcon size={14} />}>
            Profile
          </DropdownItem>
        </Link>
        <Link href="/settings">
          <DropdownItem leftIcon={<Settings size={14} />}>
            Settings
          </DropdownItem>
        </Link>
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
  const pathname = usePathname()
  const sectionTitle = getSectionTitle(pathname)
  const { user: liveUser } = useUser()
  const activeProfile = liveUser ?? profile

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-30 -mx-6 flex h-14 items-center justify-between border-b border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] px-4 md:hidden'
        )}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            'text-[hsl(var(--color-text-2))] transition-colors duration-150',
            'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
          )}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
          Contrakts
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <UserMenu profile={activeProfile} />
        </div>
      </div>

      <div
        className={cn(
          'sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-[hsl(var(--color-border))/0.65] md:flex'
        )}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--color-text-3))]">
            Workspace
          </p>
          <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {sectionTitle}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <UserMenu profile={activeProfile} />
        </div>
      </div>
    </>
  )
}
