import Link from 'next/link'
import { Archive, CheckCircle2, FileX, LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const REASONS = {
  not_found: {
    icon: FileX,
    title: 'Invalid invite link',
    body: 'This invite link is invalid or has already been used. Contact the person who sent it to request a new one.',
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
  },
  closed: {
    icon: Archive,
    title: 'Contract no longer active',
    body: 'This contract has been completed or voided. No further action is needed.',
    color: 'text-[hsl(var(--color-text-2))]',
    bg: 'bg-[hsl(var(--color-surface-2))]',
  },
  signed: {
    icon: CheckCircle2,
    title: 'Contract already signed',
    body: 'This invite has already been accepted and signed. Sign in to view the contract if it belongs to you.',
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
  },
  reserved: {
    icon: LockKeyhole,
    title: 'Invite reserved for another account',
    body: 'This invite is already tied to a different account. Sign in with the invited account to continue.',
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
  },
} as const

export function InvalidInvite({
  reason,
}: {
  reason: keyof typeof REASONS
}) {
  const { icon: Icon, title, body, color, bg } = REASONS[reason]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(var(--color-bg))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ position: 'absolute', top: '24px', left: '32px' }}>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'hsl(var(--color-text-1))',
          }}
        >
          Contrakts
        </span>
      </div>

      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          className={cn(
            'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full',
            bg
          )}
        >
          <Icon size={24} className={color} />
        </div>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'hsl(var(--color-text-1))',
            marginBottom: '10px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'hsl(var(--color-text-2))',
            lineHeight: '1.6',
            marginBottom: '28px',
          }}
        >
          {body}
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'hsl(var(--color-accent))',
            textDecoration: 'none',
          }}
        >
          Go to sign in
        </Link>
      </div>
    </div>
  )
}
