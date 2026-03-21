'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Scale,
  Shield,
  CheckCircle,
  Zap,
  Lock,
} from 'lucide-react'

const trustSignals = [
  { icon: Shield, label: 'Escrow protection' },
  { icon: FileText, label: 'Smart contracts' },
  { icon: Scale, label: 'AI dispute resolution' },
  { icon: Lock, label: 'End-to-end security' },
  { icon: Zap, label: 'Instant payouts' },
  { icon: CheckCircle, label: 'Milestone tracking' },
]

const floatingCards = [
  {
    title: 'Brand identity project',
    ref: 'CTR-2025-00441',
    status: 'Funded',
    statusColor: 'success',
    amount: '$12,500',
    progress: 66,
    delay: 0,
  },
  {
    title: 'Mobile app development',
    ref: 'CTR-2025-00387',
    status: 'Active',
    statusColor: 'accent',
    amount: '$45,000',
    progress: 33,
    delay: 0.15,
  },
  {
    title: 'Supply chain audit',
    ref: 'CTR-2025-00512',
    status: 'Complete',
    statusColor: 'success',
    amount: '$8,200',
    progress: 100,
    delay: 0.3,
  },
]

function FloatingContractCard({
  card,
  index,
}: {
  card: (typeof floatingCards)[number]
  index: number
}) {
  const statusColors: Record<string, string> = {
    success:
      'bg-[hsl(var(--color-success-dim))] text-[hsl(var(--color-success))]',
    accent: 'bg-[hsl(var(--color-accent-dim))] text-[hsl(var(--color-accent))]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: index === 1 ? 0 : index === 0 ? -2 : 2 }}
      animate={{ opacity: 1, y: 0, rotate: index === 1 ? 0 : index === 0 ? -2 : 2 }}
      transition={{
        duration: 0.6,
        delay: card.delay + 0.3,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="w-full max-w-[260px] rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4 shadow-card"
      style={{
        animation: `float ${6 + index}s ease-in-out infinite`,
        animationDelay: `${index * 0.8}s`,
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-2xs text-[hsl(var(--color-text-3))]">
            {card.ref}
          </p>
          <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
            {card.title}
          </p>
        </div>
        <span
          className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${statusColors[card.statusColor] ?? ''}`}
        >
          {card.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-2xs text-[hsl(var(--color-text-3))]">
            Progress
          </span>
          <span className="text-2xs font-medium text-[hsl(var(--color-text-2))]">
            {card.progress}%
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${card.progress}%` }}
            transition={{ duration: 1, delay: card.delay + 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-[hsl(var(--color-accent))]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[hsl(var(--color-text-3))]">Escrow</span>
        <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
          {card.amount}
        </span>
      </div>
    </motion.div>
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
      {/* Left panel — visual showcase */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-12 md:flex">
        {/* Ambient background depth */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsl(var(--color-accent)/0.08)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,hsl(var(--color-accent)/0.05)_0%,transparent_70%)]" />

        {/* Grid overlay */}
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))]">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[hsl(var(--color-text-1))]">
              Contrakts
            </span>
          </div>
          <p className="text-md text-[hsl(var(--color-text-2))]">
            Every deal. Protected.
          </p>
        </motion.div>

        {/* Floating contract cards */}
        <div className="relative z-10 flex flex-col items-center gap-4 py-8">
          {floatingCards.map((card, i) => (
            <FloatingContractCard key={card.ref} card={card} index={i} />
          ))}
        </div>

        {/* Trust signal chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative z-10"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {trustSignals.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-1.5 transition-colors hover:border-[hsl(var(--color-border-2))]"
              >
                <Icon
                  size={12}
                  className="text-[hsl(var(--color-accent))]"
                />
                <span className="text-xs text-[hsl(var(--color-text-2))]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            &copy; {new Date().getFullYear()} Contrakts. All rights reserved.
          </p>
        </motion.div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))]">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[hsl(var(--color-text-1))]">
              Contrakts
            </span>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
