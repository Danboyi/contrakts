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
  User,
  X,
} from 'lucide-react'
import { logout } from '@/lib/auth/actions'
import { useUser } from '@/hooks/use-user'
import { useSidebar } from '@/lib/context/sidebar-context'
import { cn } from '@/lib/utils/cn'
import { Avatar } from '@/components/ui/avatar'
import { TrustScore } from '@/components/ui/trust-score'
import type { User as UserType } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: ElementType
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
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium',
        'transition-all duration-150',
        active
          ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
          : 'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]'
      )}
    >
      <item.icon size={18} className="flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function Sidebar({ profile }: { profile: UserType }) {
  const pathname = usePathname()
  const { user: liveUser } = useUser()
  const activeProfile = liveUser ?? profile
  const { isOpen, close } = useSidebar()

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }

    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col bg-[hsl(var(--color-surface))]',
        'border-r border-[hsl(var(--color-border))]'
      )}
    >
      <div
        className={cn(
          'flex h-16 flex-shrink-0 items-center justify-between border-b border-[hsl(var(--color-border))] px-5'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2" onClick={close}>
          <span
            className={cn(
              'h-2 w-2 flex-shrink-0 rounded-full',
              'bg-[hsl(var(--color-accent))]'
            )}
          />
          <span className="text-base font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
            Contrakts
          </span>
        </Link>

        <button
          type="button"
          onClick={close}
          className={cn(
            'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] -mr-2 p-2',
            'text-[hsl(var(--color-text-3))] transition-all duration-150',
            'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))] lg:hidden'
          )}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-5">
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
            Workspace
          </p>
          <nav className="flex flex-col gap-1">
            {workspaceNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={close}
              />
            ))}
          </nav>
        </div>

        <div className="mx-2 my-4 h-px bg-[hsl(var(--color-border))]" />

        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
            Account
          </p>
          <nav className="flex flex-col gap-1">
            {accountNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={close}
              />
            ))}
          </nav>
        </div>
      </div>

      <div
        className={cn(
          'flex-shrink-0 border-t border-[hsl(var(--color-border))] px-3 py-4'
        )}
      >
        <div
          className={cn(
            'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
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
                onClick={close}
                className="block truncate text-sm font-medium text-[hsl(var(--color-text-1))] transition-colors hover:text-[hsl(var(--color-accent))]"
              >
                {activeProfile.full_name}
              </Link>
              <Link href="/profile#overview" onClick={close} className="inline-flex">
                <TrustScore score={activeProfile.trust_score} size="sm" />
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              close()
              void logout()
            }}
            className={cn(
              'flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs',
              'text-[hsl(var(--color-text-3))] transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-danger))]'
            )}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen w-[260px] flex-shrink-0 lg:flex lg:flex-col'
        )}
      >
        {sidebarContent}
      </aside>

      {isOpen && (
        <button
          type="button"
          onClick={close}
          className={cn(
            'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden',
            'animate-in fade-in duration-200'
          )}
          aria-label="Close sidebar backdrop"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] lg:hidden',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
