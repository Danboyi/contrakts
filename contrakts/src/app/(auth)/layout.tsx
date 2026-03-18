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
    <div
      style={{
        background: 'hsl(var(--color-surface-2))',
        border: '0.5px solid hsl(var(--color-border))',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        width: '100%',
        maxWidth: '280px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              color: 'hsl(var(--color-text-3))',
              marginBottom: '4px',
            }}
          >
            CTR-2025-00441
          </p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'hsl(var(--color-text-1))',
            }}
          >
            Brand identity project
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'hsl(var(--color-success) / 0.12)',
            color: 'hsl(var(--color-success))',
          }}
        >
          Funded
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {['AC', 'BR'].map((initials, index) => (
          <div
            key={initials}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background:
                index === 0
                  ? 'hsl(var(--color-accent) / 0.2)'
                  : 'hsl(var(--color-success) / 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color:
                index === 0
                  ? 'hsl(var(--color-accent))'
                  : 'hsl(var(--color-success))',
            }}
          >
            {initials}
          </div>
        ))}
        <span
          style={{
            fontSize: '12px',
            color: 'hsl(var(--color-text-3))',
            alignSelf: 'center',
          }}
        >
          2 parties
        </span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'hsl(var(--color-text-3))' }}>
            Milestones
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--color-text-2))' }}>
            2 of 3
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'hsl(var(--color-border))',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '66%',
              height: '100%',
              background: 'hsl(var(--color-success))',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'hsl(var(--color-text-3))' }}>
          Escrow
        </span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'hsl(var(--color-text-1))',
          }}
        >
          $12,500.00
        </span>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/invite')) {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(var(--color-bg))' }}>
      <div
        style={{
          width: '40%',
          minHeight: '100vh',
          background: 'hsl(var(--color-surface))',
          borderRight: '0.5px solid hsl(var(--color-border))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hidden md:flex"
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            background:
              'radial-gradient(circle, hsl(var(--color-accent) / 0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: 'hsl(var(--color-text-1))',
              letterSpacing: '-0.5px',
              marginBottom: '10px',
            }}
          >
            Contrakts
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'hsl(var(--color-text-2))',
              marginBottom: '32px',
            }}
          >
            Every deal. Protected.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trustSignals.map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'hsl(var(--color-surface-2))',
                  border: '0.5px solid hsl(var(--color-border))',
                  borderRadius: '9999px',
                  width: 'fit-content',
                }}
              >
                <Icon size={12} color="hsl(var(--color-accent))" />
                <span style={{ fontSize: '12px', color: 'hsl(var(--color-text-2))' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MockContractCard />
        </div>

        <p style={{ fontSize: '12px', color: 'hsl(var(--color-text-3))' }}>
          Copyright {new Date().getFullYear()} Contrakts. All rights reserved.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          minHeight: '100vh',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <p
            style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '32px',
              color: 'hsl(var(--color-text-1))',
            }}
            className="md:hidden"
          >
            Contrakts
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
