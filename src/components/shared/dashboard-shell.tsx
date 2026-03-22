'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Settings, User } from 'lucide-react'
import { Breadcrumbs } from './breadcrumbs'
import { CommandPalette } from './command-palette'
import { Header } from './header'
import { OnboardingWizard } from './onboarding-wizard'
import { PageTransition } from './page-transition'
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './sidebar'
import { cn } from '@/lib/utils/cn'
import type { User as UserProfile } from '@/types'

const mobileNav = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Contracts', href: '/contracts', icon: FileText },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('contrakts_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
  }, [])

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <div className="flex min-h-screen bg-[hsl(var(--color-bg))]">
      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col md:flex',
          'border-r border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))]',
          'transition-[width] duration-[250ms] ease-out'
        )}
      >
        <Sidebar profile={profile} onCollapsedChange={handleCollapsedChange} />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
          'transition-transform duration-[250ms] ease-out md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
      </aside>

      <main className="min-h-screen flex-1 transition-[margin-left] duration-[250ms] ease-out md:ml-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${sidebarWidth}px` } as React.CSSProperties}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-6 pb-24 md:px-8 md:pb-8">
          <Header
            profile={profile}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="hidden py-3 md:block">
            <Breadcrumbs />
          </div>
          <div className="flex-1 py-4 md:py-6">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </main>

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))/0.96] px-2 py-2 backdrop-blur-xl md:hidden'
        )}
      >
        {mobileNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[68px] flex-col items-center gap-1 rounded-[var(--radius-md)] px-3 py-2 text-[11px] transition-all duration-150',
                active
                  ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                  : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-1))]'
              )}
            >
              <item.icon size={16} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <CommandPalette />
      <OnboardingWizard />
    </div>
  )
}
