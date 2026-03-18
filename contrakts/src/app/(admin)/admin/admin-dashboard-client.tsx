'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle, DollarSign, FileText, TrendingUp } from 'lucide-react'
import { ActivityItem } from '@/components/shared/activity-item'
import { MetricCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatRelative } from '@/lib/utils/format-date'

const STATE_COLORS: Record<string, string> = {
  draft: 'bg-[hsl(var(--color-border))]',
  pending: 'bg-[hsl(var(--color-warning))]',
  funded: 'bg-[hsl(var(--color-accent))]',
  active: 'bg-[hsl(var(--color-success))]',
  in_review: 'bg-[hsl(var(--color-warning)/0.7)]',
  disputed: 'bg-[hsl(var(--color-danger))]',
  complete: 'bg-[hsl(var(--color-success)/0.6)]',
  voided: 'bg-[hsl(var(--color-border-2))]',
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  funded: 'Funded',
  active: 'Active',
  in_review: 'In review',
  disputed: 'Disputed',
  complete: 'Complete',
  voided: 'Voided',
}

export function AdminDashboardClient({
  metrics,
  disputes,
  activity,
  stateCount,
  totalContracts,
}: {
  metrics: {
    total_contracts: number
    active_contracts: number
    completed_contracts: number
    disputed_contracts: number
    open_disputes: number
    total_users: number
    total_revenue: number
    total_escrow_volume: number
  }
  disputes: Array<{
    id: string
    status: string
    raised_at: string
    contract: { id: string; ref_code: string; title: string; currency: string } | null
    milestone: { title: string; amount: number } | null
  }>
  activity: Array<{
    id: string
    event_type: string
    payload: Record<string, unknown> | null
    created_at: string
    actor: { full_name: string } | null
  }>
  stateCount: Record<string, number>
  totalContracts: number
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--color-text-2))]">
          Live metrics across contracts, disputes, and revenue.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total contracts"
          value={metrics.total_contracts.toLocaleString()}
          sub={`${metrics.active_contracts} active`}
          icon={<FileText size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Escrow volume"
          value={formatCurrency(metrics.total_escrow_volume, 'USD')}
          sub="All time"
          icon={<DollarSign size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Open disputes"
          value={metrics.open_disputes}
          sub={metrics.open_disputes > 0 ? 'Needs review' : 'Clear'}
          trend={metrics.open_disputes > 0 ? 'down' : 'up'}
          icon={<AlertTriangle size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Platform revenue"
          value={formatCurrency(metrics.total_revenue, 'USD')}
          sub="Successful fee capture"
          trend="up"
          icon={<TrendingUp size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Open disputes
            </h2>
            <Link
              href="/admin/disputes"
              className="flex items-center gap-1 text-xs text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {disputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] py-10 text-center">
              <p className="text-sm font-medium text-[hsl(var(--color-success))]">
                No open disputes
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                The arbitration queue is clear.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {disputes.map((dispute) => (
                <Link
                  key={dispute.id}
                  href={`/admin/disputes?id=${dispute.id}`}
                  className={cn(
                    'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] border-l-2 border-l-[hsl(var(--color-danger))]',
                    'bg-[hsl(var(--color-surface))] p-3 transition-colors duration-150 hover:border-[hsl(var(--color-border-2))]'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[hsl(var(--color-text-1))]">
                      {dispute.contract?.title ?? 'Unknown contract'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
                      {dispute.milestone?.title ?? 'Milestone'} -{' '}
                      {formatCurrency(
                        dispute.milestone?.amount ?? 0,
                        dispute.contract?.currency ?? 'USD'
                      )}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Badge variant="danger" size="sm">
                      {dispute.status.replaceAll('_', ' ')}
                    </Badge>
                    <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                      {formatRelative(dispute.raised_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Recent platform activity
          </h2>
          {activity.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
              <p className="text-sm text-[hsl(var(--color-text-3))]">
                No activity yet.
              </p>
            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
              {activity.map((item, index) => (
                <ActivityItem
                  key={item.id}
                  event_type={item.event_type}
                  payload={item.payload ?? {}}
                  created_at={item.created_at}
                  actor_name={item.actor?.full_name}
                  last={index === activity.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {totalContracts > 0 && (
        <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Contract state distribution
          </h2>

          <div className="mb-4 flex h-3 overflow-hidden rounded-full">
            {Object.entries(stateCount)
              .filter(([, count]) => count > 0)
              .map(([state, count]) => (
                <div
                  key={state}
                  className={cn(
                    STATE_COLORS[state] ?? 'bg-[hsl(var(--color-border))]',
                    'transition-all duration-500'
                  )}
                  style={{ width: `${(count / totalContracts) * 100}%` }}
                  title={`${STATE_LABELS[state] ?? state}: ${count}`}
                />
              ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(stateCount)
              .filter(([, count]) => count > 0)
              .map(([state, count]) => (
                <div key={state} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      STATE_COLORS[state] ?? 'bg-[hsl(var(--color-border))]'
                    )}
                  />
                  <span className="text-xs text-[hsl(var(--color-text-2))]">
                    {STATE_LABELS[state] ?? state}
                  </span>
                  <span className="text-xs font-medium text-[hsl(var(--color-text-1))]">
                    {count}
                  </span>
                  <span className="text-xs text-[hsl(var(--color-text-3))]">
                    ({Math.round((count / totalContracts) * 100)}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
