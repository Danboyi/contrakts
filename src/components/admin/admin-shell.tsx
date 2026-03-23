'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  DollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  Scale,
  ScrollText,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
import type { AdminUser } from '@/lib/admin/auth'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale },
  { label: 'Contracts', href: '/admin/contracts', icon: FileText },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { label: 'Audit log', href: '/admin/audit', icon: ScrollText },
] as const

function AdminSidebar({
  admin,
  onNavigate,
}: {
  admin: AdminUser
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--color-surface))]">
      <div className="h-0.5 w-full shrink-0 bg-[hsl(var(--color-danger))]" />

      <div className="mb-6 flex h-16 items-center gap-2 border-b border-[hsl(var(--color-border))] px-5">
        <ShieldAlert
          size={16}
          className="shrink-0 text-[hsl(var(--color-danger))]"
        />
        <span className="text-base font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
          Contrakts
        </span>
        <span
          className={cn(
            'rounded-full border border-[hsl(var(--color-danger)/0.2)]',
            'bg-[hsl(var(--color-danger)/0.12)] px-1.5 py-0.5',
            'text-[10px] font-bold text-[hsl(var(--color-danger))]'
          )}
        >
          Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-all duration-150',
                active
                  ? 'bg-[hsl(var(--color-danger)/0.1)] font-medium text-[hsl(var(--color-danger))]'
                  : 'text-[hsl(var(--color-text-2))] hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  'shrink-0',
                  active
                    ? 'text-[hsl(var(--color-danger))]'
                    : 'text-[hsl(var(--color-text-3))]'
                )}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto h-4 w-0.5 rounded-full bg-[hsl(var(--color-danger))]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'mx-3 mb-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface-2))] p-3'
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <Avatar
            name={admin.profile.full_name}
            src={admin.profile.avatar_url}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[hsl(var(--color-text-1))]">
              {admin.profile.full_name}
            </p>
            <p className="text-[11px] font-medium capitalize text-[hsl(var(--color-danger))]">
              {admin.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            router.push('/dashboard')
          }}
          className={cn(
            'flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs',
            'text-[hsl(var(--color-text-3))] transition-all duration-150',
            'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-2))]'
          )}
        >
          <ArrowLeft size={13} />
          Exit admin
        </button>
      </div>
    </div>
  )
}

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }

    document.body.style.overflow = ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[hsl(var(--color-bg))]">
      <aside
        className={cn(
          'hidden lg:flex lg:w-[240px] lg:flex-shrink-0 lg:flex-col',
          'border-r border-[hsl(var(--color-border))]'
        )}
      >
        <AdminSidebar admin={admin} />
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] border-r border-[hsl(var(--color-border))] transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-end border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-text-3))] transition-all duration-150 hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        </div>
        <AdminSidebar admin={admin} onNavigate={() => setIsOpen(false)} />
      </aside>

      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto flex min-h-full w-full min-w-0 max-w-[1200px] flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mb-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-[hsl(var(--color-danger)/0.15)] bg-[hsl(var(--color-danger)/0.04)] px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-danger))]"
              aria-label="Open admin menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert
                size={14}
                className="text-[hsl(var(--color-danger))]"
              />
              <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Admin
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="min-h-[44px] text-xs text-[hsl(var(--color-text-3))]"
            >
              Exit
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
