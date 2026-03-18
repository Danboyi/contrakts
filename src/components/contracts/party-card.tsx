import { Clock, PenLine } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrustScore } from '@/components/ui/trust-score'
import { cn } from '@/lib/utils/cn'

interface PartyCardProps {
  role: 'initiator' | 'counterparty'
  user: {
    full_name: string
    email: string
    avatar_url: string | null
    trust_score: number
    kyc_status: string
  } | null
  signedAt: string | null
  isYou: boolean
  placeholder?: string
}

export function PartyCard({
  role,
  user,
  signedAt,
  isYou,
  placeholder,
}: PartyCardProps) {
  const hasSigned = Boolean(signedAt)

  if (!user) {
    return (
      <div className="flex-1 rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
          {role === 'initiator' ? 'Initiator' : 'Counterparty'}
        </p>
        <p className="text-sm italic text-[hsl(var(--color-text-3))]">
          {placeholder ?? 'Invite pending'}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <Clock size={11} className="text-[hsl(var(--color-warning))]" />
          <span className="text-xs text-[hsl(var(--color-warning))]">
            Awaiting acceptance
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-1 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4',
        isYou &&
          'border-[hsl(var(--color-accent)/0.3)] bg-[hsl(var(--color-accent)/0.03)]'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
          {role === 'initiator' ? 'Initiator' : 'Counterparty'}
          {isYou && (
            <span className="ml-2 text-[hsl(var(--color-accent))]">- You</span>
          )}
        </p>
        {user.kyc_status === 'verified' && (
          <Badge variant="gold" size="sm">
            Verified
          </Badge>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Avatar
          name={user.full_name}
          src={user.avatar_url}
          size="md"
          verified={user.kyc_status === 'verified'}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {user.full_name}
          </p>
          <p className="truncate text-xs text-[hsl(var(--color-text-3))]">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TrustScore score={user.trust_score} size="sm" />
        <div className="flex items-center gap-1.5">
          {hasSigned ? (
            <>
              <PenLine size={11} className="text-[hsl(var(--color-success))]" />
              <span className="text-[11px] text-[hsl(var(--color-success))]">
                Signed
              </span>
            </>
          ) : (
            <>
              <Clock size={11} className="text-[hsl(var(--color-warning))]" />
              <span className="text-[11px] text-[hsl(var(--color-warning))]">
                Awaiting signature
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
