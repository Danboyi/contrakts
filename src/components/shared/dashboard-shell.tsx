'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Settings, User } from 'lucide-react'
import { MobileHeader } from '@/components/layout/mobile-header'
import { Header } from './header'
import { PageTransition } from './page-transition'
import { Sidebar } from './sidebar'
import { SidebarProvider } from '@/lib/context/sidebar-context'
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-[hsl(var(--color-bg))]">
        <Sidebar profile={profile} />

        <div className="flex w-full min-w-0 flex-1 flex-col">
          <MobileHeader />

          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="mx-auto flex min-h-full w-full min-w-0 max-w-[1400px] flex-col px-4 pb-20 pt-6 sm:px-6 md:px-6 md:pb-6 lg:px-8 lg:pb-8 lg:pt-8">
              <Header profile={profile} />
              <div className="flex-1 min-w-0 py-6 lg:py-8">
                <PageTransition>{children}</PageTransition>
              </div>
            </div>
          </main>
        </div>

        <nav
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))/0.96] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden'
          )}
        >
          {mobileNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 py-2 text-[10px] transition-all duration-150',
                  active
                    ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                    : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-1))]'
                )}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span className="mt-0.5 truncate font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </SidebarProvider>
  )
}
