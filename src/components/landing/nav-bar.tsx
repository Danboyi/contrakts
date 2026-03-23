'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'API', href: '#api' },
]

function isHashLink(href: string) {
  return href.startsWith('#')
}

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const navClassName = useMemo(
    () =>
      cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-b border-[hsl(var(--color-border)/0.8)] bg-[hsl(var(--color-bg)/0.88)] backdrop-blur-xl'
          : 'bg-transparent'
      ),
    [scrolled]
  )

  const handleNavClick = (href: string) => {
    if (!isHashLink(href)) return

    const target = document.querySelector(href)
    if (!(target instanceof HTMLElement)) return

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  return (
    <>
      <header className={navClassName}>
        <div className="mx-auto flex h-20 w-full max-w-[1140px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--color-text-1))]"
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-accent))] shadow-[0_0_22px_hsl(var(--color-accent)/0.65)]" />
            Contrakts
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="text-sm text-[hsl(var(--color-text-2))] transition-colors duration-150 hover:text-[hsl(var(--color-text-1))]"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'md' }),
                'text-[hsl(var(--color-text-1))]'
              )}
            >
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: 'md' })}>
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border md:hidden',
              scrolled
                ? 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
                : 'border-[hsl(var(--color-border)/0.6)] bg-[hsl(var(--color-surface)/0.25)] backdrop-blur-md'
            )}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/55 md:hidden"
              aria-label="Close navigation drawer"
            />
            <motion.aside
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col border-l border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg))] px-6 py-6 md:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--color-text-1))]">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-accent))]" />
                  Contrakts
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]"
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className="flex h-12 items-center rounded-[var(--radius-lg)] px-4 text-left text-base text-[hsl(var(--color-text-2))] transition-colors duration-150 hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-1))]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'lg' }),
                    'w-full text-[hsl(var(--color-text-1))]'
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                >
                  Get started
                </Link>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
