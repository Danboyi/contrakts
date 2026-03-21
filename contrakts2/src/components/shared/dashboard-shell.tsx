'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Plus, Settings, User } from 'lucide-react'
import { Header } from './header'
import { PageTransition } from './page-transition'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils/cn'
import type { User as UserProfile } from '@/types'

const mobileNav = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Contracts', href: '/contracts', icon: FileText },
  { label: 'New', href: '/contracts/new', icon: Plus, isAction: true },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

export function DashboardShell({
  profile,
  children,
}: {
  profile: UserProfile
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[hsl(var(--color-bg))]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col md:flex',
          'border-r border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))]'
        )}
      >
        <Sidebar profile={profile} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
          'transition-transform duration-[250ms] ease-out-expo md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="min-h-screen flex-1 md:ml-[240px]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-6 pb-24 md:px-8 md:pb-8">
          <Header
            profile={profile}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="flex-1 py-6 md:py-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav — enhanced with center action button */}
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[hsl(var(--color-border))]',
          'glass px-2 py-2 md:hidden'
        )}
      >
        {mobileNav.map((item) => {
          const active = 'isAction' in item
            ? false
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

          if ('isAction' in item && item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--color-accent))] to-[hsl(var(--color-accent-2))] text-white shadow-[0_0_16px_hsl(var(--color-accent)/0.3)] transition-transform active:scale-95"
              >
                <item.icon size={18} />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[56px] flex-col items-center gap-1 rounded-[var(--radius-md)] px-3 py-2 text-2xs transition-all duration-200',
                active
                  ? 'text-[hsl(var(--color-accent))]'
                  : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              <item.icon size={16} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
