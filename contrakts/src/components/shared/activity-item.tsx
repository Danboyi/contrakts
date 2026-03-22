import type { ElementType } from 'react'
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  PenLine,
  Send,
  Shield,
  ThumbsUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format-date'

const EVENT_MAP: Record<
  string,
  {
    icon: ElementType
    color: string
    bg: string
    label: (payload: Record<string, unknown>) => string
  }
> = {
  'contract.created': {
    icon: FileText,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    label: () => 'Contract created',
  },
  'contract.sent': {
    icon: Send,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    label: () => 'Invite sent',
  },
  'contract.signed': {
    icon: PenLine,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    label: () => 'Contract signed',
  },
  'contract.funded': {
    icon: DollarSign,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Escrow funded',
  },
  'milestone.submitted': {
    icon: Clock,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    label: () => 'Delivery submitted',
  },
  'milestone.approved': {
    icon: CheckCircle,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Milestone approved',
  },
  'payment.released': {
    icon: DollarSign,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Payment released',
  },
  'dispute.raised': {
    icon: AlertTriangle,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: () => 'Dispute raised',
  },
  'dispute.resolved': {
    icon: Shield,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Dispute resolved',
  },
  'contract.review_submitted': {
    icon: ArrowRightLeft,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    label: (payload) =>
      `Review submitted${payload.changes_summary ? `: ${payload.changes_summary}` : ''}`,
  },
  'contract.terms_accepted': {
    icon: ThumbsUp,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Contract terms accepted',
  },
  'contract.voided': {
    icon: AlertTriangle,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: () => 'Contract voided',
  },
  'contract.complete': {
    icon: CheckCircle,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: () => 'Contract completed',
  },
}

interface ActivityItemProps {
  event_type: string
  payload: Record<string, unknown>
  created_at: string
  actor_name?: string
  last?: boolean
}

export function ActivityItem({
  event_type,
  payload,
  created_at,
  actor_name,
  last,
}: ActivityItemProps) {
  const config = EVENT_MAP[event_type] ?? {
    icon: FileText,
    color: 'text-[hsl(var(--color-text-3))]',
    bg: 'bg-[hsl(var(--color-surface-2))]',
    label: () => event_type.replace(/\./g, ' '),
  }
  const Icon = config.icon

  return (
    <div className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            config.bg
          )}
        >
          <Icon size={13} className={config.color} />
        </div>
        {!last && (
          <div className="mt-1.5 w-px flex-1 bg-[hsl(var(--color-border))]" />
        )}
      </div>

      <div className={cn('min-w-0 pb-5', last && 'pb-0')}>
        <p className="text-sm leading-snug text-[hsl(var(--color-text-1))]">
          {config.label(payload)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {actor_name && (
            <span className="text-xs text-[hsl(var(--color-text-3))]">
              {actor_name}
            </span>
          )}
          {actor_name && (
            <span className="text-xs text-[hsl(var(--color-border-2))]">-</span>
          )}
          <span className="text-xs text-[hsl(var(--color-text-3))]">
            {formatRelative(created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
