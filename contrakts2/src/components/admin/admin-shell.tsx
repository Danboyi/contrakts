'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  FileText,
  LayoutDashboard,
  Scale,
  ScrollText,
  ShieldAlert,
  Users,
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

function AdminSidebar({ admin }: { admin: AdminUser }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col py-4">
      <div className="mb-6 flex h-8 items-center gap-2 px-5">
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

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'mx-2 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-all duration-150',
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
          'mx-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
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
          onClick={() => router.push('/dashboard')}
          className={cn(
            'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs',
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

  return (
    <div className="flex min-h-screen bg-[hsl(var(--color-bg))]">
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-40 hidden w-[240px] flex-col md:flex',
          'border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
        )}
      >
        <div className="h-0.5 w-full shrink-0 bg-[hsl(var(--color-danger))]" />
        <AdminSidebar admin={admin} />
      </aside>

      <main className="min-h-screen flex-1 md:ml-[240px]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-6 md:px-8 md:py-8">
          <div className="mb-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-[hsl(var(--color-danger)/0.15)] bg-[hsl(var(--color-danger)/0.04)] px-4 py-3 md:hidden">
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
              className="text-xs text-[hsl(var(--color-text-3))]"
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
