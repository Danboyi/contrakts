'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { FileText, Scale, Shield } from 'lucide-react'

const trustSignals = [
  { icon: FileText, label: 'Contract execution' },
  { icon: Shield, label: 'Milestone escrow' },
  { icon: Scale, label: 'Dispute arbitration' },
]

function MockContractCard() {
  return (
    <div className="w-full max-w-[280px] rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] text-[hsl(var(--color-text-3))]">
            CTR-2025-00441
          </p>
          <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
            Brand identity project
          </p>
        </div>
        <span className="rounded-full bg-[hsl(var(--color-success)/0.12)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--color-success))]">
          Funded
        </span>
      </div>

      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {[
            ['AC', 'accent'],
            ['BR', 'success'],
          ].map(([initials, color]) => (
            <div
              key={initials}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[hsl(var(--color-surface-2))] text-[10px] font-semibold"
              style={{
                background: `hsl(var(--color-${color}) / 0.2)`,
                color: `hsl(var(--color-${color}))`,
              }}
            >
              {initials}
            </div>
          ))}
        </div>
        <span className="text-xs text-[hsl(var(--color-text-3))]">2 parties</span>
      </div>

      <div className="mb-2">
        <div className="mb-1.5 flex justify-between">
          <span className="text-[11px] text-[hsl(var(--color-text-3))]">
            Milestones
          </span>
          <span className="text-[11px] text-[hsl(var(--color-text-2))]">
            2 of 3
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
          <div
            className="h-full rounded-full bg-[hsl(var(--color-success))]"
            style={{ width: '66%' }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-between border-t border-[hsl(var(--color-border))] pt-3">
        <span className="text-xs text-[hsl(var(--color-text-3))]">Escrow</span>
        <span className="text-[13px] font-medium text-[hsl(var(--color-text-1))]">
          $12,500.00
        </span>
      </div>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname.startsWith('/invite')) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--color-bg))]">
      {/* Left panel */}
      <div className="relative hidden min-h-screen w-[40%] flex-col justify-between overflow-hidden border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-10 py-12 md:flex">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[30%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--color-accent)/0.07)] blur-[80px]"
        />

        <div className="relative">
          <h1 className="mb-2.5 text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
            Contrakts
          </h1>
          <p className="mb-8 text-base text-[hsl(var(--color-text-2))]">
            Every deal. Protected.
          </p>
          <div className="flex flex-col gap-2">
            {trustSignals.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-1.5"
              >
                <Icon size={12} className="text-[hsl(var(--color-accent))]" />
                <span className="text-xs text-[hsl(var(--color-text-2))]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center">
          <MockContractCard />
        </div>

        <p className="relative text-xs text-[hsl(var(--color-text-3))]">
          Copyright {new Date().getFullYear()} Contrakts. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-[400px]"
        >
          <p className="mb-8 text-xl font-semibold text-[hsl(var(--color-text-1))] md:hidden">
            Contrakts
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
