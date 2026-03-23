'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const partyPills = [
  {
    initials: 'CB',
    name: 'Caleb B.',
    role: 'Service Receiver',
    tint: 'bg-[hsl(var(--color-accent)/0.18)] text-[hsl(var(--color-accent))]',
  },
  {
    initials: 'AM',
    name: 'Amina M.',
    role: 'Service Provider',
    tint: 'bg-[hsl(var(--color-success)/0.16)] text-[hsl(var(--color-success))]',
  },
]

export function HeroMock() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      className="relative mx-auto w-full max-w-[720px] px-2 sm:px-0"
    >
      <div className="absolute inset-x-12 -top-4 h-24 rounded-full bg-[radial-gradient(circle,_hsl(var(--color-accent)/0.22),_transparent_72%)] blur-3xl" />
      <div
        className={cn(
          'relative overflow-hidden rounded-[28px] border border-[hsl(var(--color-accent)/0.22)]',
          'bg-[linear-gradient(180deg,hsl(var(--color-surface)/0.96),hsl(var(--color-bg)/0.98))]',
          'shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl'
        )}
        style={{
          transform:
            'perspective(1800px) rotateX(10deg) rotateY(-11deg) rotateZ(1.5deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--color-accent)/0.12),transparent_50%)]" />

        <div className="relative border-b border-[hsl(var(--color-border)/0.85)] px-5 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--color-text-3))]">
                CTR-2026-01472
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[hsl(var(--color-text-1))] sm:text-xl">
                Food delivery platform build
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-success)/0.22)] bg-[hsl(var(--color-success)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--color-success))]">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--color-success))]" />
              Active
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {partyPills.map((party) => (
              <div
                key={party.name}
                className="flex items-center gap-2 rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.7)] px-3 py-2"
              >
                <span
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                    party.tint
                  )}
                >
                  {party.initials}
                </span>
                <div>
                  <p className="text-xs text-[hsl(var(--color-text-3))]">
                    {party.role}
                  </p>
                  <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {party.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative grid gap-4 px-5 py-5 sm:grid-cols-[1.2fr_0.8fr] sm:px-6">
          <div className="rounded-[22px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.72)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                  Milestone progress
                </p>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  Product design and API integration
                </p>
              </div>
              <MoreHorizontal
                size={16}
                className="text-[hsl(var(--color-text-3))]"
              />
            </div>

            <div className="mb-2 flex items-center justify-between text-xs text-[hsl(var(--color-text-3))]">
              <span>Released</span>
              <span className="font-medium text-[hsl(var(--color-text-2))]">
                66%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--color-surface))]">
              <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,hsl(var(--color-accent)),hsl(var(--color-success)))]" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-[18px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface)/0.8)] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--color-text-3))]">
                  Escrow
                </p>
                <p className="mt-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                  $12,500
                </p>
              </div>
              <div className="rounded-[18px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface)/0.8)] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--color-text-3))]">
                  Dispute SLA
                </p>
                <p className="mt-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                  48 hrs
                </p>
              </div>
              <div className="rounded-[18px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface)/0.8)] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--color-text-3))]">
                  Status
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--color-success))]">
                  <LockKeyhole size={14} />
                  Protected
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.72)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Recent activity
              </p>
              <Clock3 size={15} className="text-[hsl(var(--color-text-3))]" />
            </div>

            <div className="space-y-3">
              <div className="rounded-[18px] border border-[hsl(var(--color-success)/0.22)] bg-[hsl(var(--color-success)/0.1)] p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.16)] text-[hsl(var(--color-success))]">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--color-success))]">
                      Payment released
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                      Milestone 2 approved. $4,200 sent instantly to the service
                      provider wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface)/0.8)] p-3">
                <p className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                  Up next
                </p>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  QA and release handoff
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  Delivery window closes in 6 days. Escrow for milestone 3
                  remains locked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
