'use client'

import { motion } from 'framer-motion'
import {
  ArrowRightLeft,
  Check,
  Clock,
  FileEdit,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format-date'
import type { NegotiationRound } from '@/types'

interface NegotiationTimelineProps {
  rounds: NegotiationRound[]
  currentUserId: string
}

const statusConfig = {
  pending_review: {
    icon: Clock,
    label: 'Awaiting review',
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.12)]',
  },
  reviewed: {
    icon: FileEdit,
    label: 'Reviewed',
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.12)]',
  },
  countered: {
    icon: ArrowRightLeft,
    label: 'Counter-offer',
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.12)]',
  },
  accepted: {
    icon: Check,
    label: 'Accepted',
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.12)]',
  },
}

export function NegotiationTimeline({
  rounds,
  currentUserId,
}: NegotiationTimelineProps) {
  if (rounds.length === 0) {
    return null
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
      <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
        Negotiation history
      </h2>

      <div className="relative">
        <div className="absolute bottom-0 left-[15px] top-0 w-px bg-[hsl(var(--color-border))]" />

        <div className="flex flex-col gap-4">
          {/* Initial proposal */}
          <div className="relative flex gap-3 pl-1">
            <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-accent)/0.12)]">
              <Send size={13} className="text-[hsl(var(--color-accent))]" />
            </div>
            <div className="pt-1">
              <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                Contract created
              </p>
              <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                Initial proposal sent for review
              </p>
            </div>
          </div>

          {rounds.map((round, index) => {
            const config = statusConfig[round.status]
            const Icon = config.icon
            const isYou = round.submitted_by === currentUserId
            const submitterName = isYou
              ? 'You'
              : round.submitted_by_user?.full_name ?? 'Other party'

            return (
              <motion.div
                key={round.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex gap-3 pl-1"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full',
                    config.bg
                  )}
                >
                  <Icon size={13} className={config.color} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                      Round {round.round_number}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        config.bg,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-2))]">
                    <span className="font-medium">{submitterName}</span>
                    {' — '}
                    {round.changes_summary}
                  </p>
                  <p className="mt-1 text-[11px] text-[hsl(var(--color-text-3))]">
                    {formatDateTime(round.created_at)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
