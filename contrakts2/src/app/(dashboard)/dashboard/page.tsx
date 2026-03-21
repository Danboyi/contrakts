import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { ContractCard } from '@/components/contracts/contract-card'
import { ActivityItem } from '@/components/shared/activity-item'
import { PageHeader } from '@/components/shared/page-header'
import { PendingActionCard } from '@/components/shared/pending-action-card'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { createClient } from '@/lib/supabase/server'
import type { Contract, User } from '@/types'

type DashboardContract = Contract & {
  initiator: { full_name: string; avatar_url: string | null } | null
  counterparty: { full_name: string; avatar_url: string | null } | null
  milestones: Array<{ state: string; amount: number }> | null
}

type ActivityRow = {
  id: string
  event_type: string
  payload: Record<string, unknown> | null
  created_at: string
  actor: { full_name: string } | null
}

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (profileData ?? null) as User | null

  if (!profile) redirect('/login')

  const { data: contractsData } = await supabase
    .from('contracts')
    .select(
      `
      *,
      initiator:users!initiator_id(full_name, avatar_url),
      counterparty:users!counterparty_id(full_name, avatar_url),
      milestones(state, amount)
    `
    )
    .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const allContracts = (contractsData ?? []) as unknown as DashboardContract[]
  const recentContracts = allContracts.slice(0, 4)

  const contractIds = allContracts.map((contract) => contract.id)
  let activity: ActivityRow[] = []

  if (contractIds.length > 0) {
    const { data: activityData } = await supabase
      .from('audit_log')
      .select('id, event_type, payload, created_at, actor:users!actor_id(full_name)')
      .or(`contract_id.in.(${contractIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(8)

    activity = (activityData ?? []) as unknown as ActivityRow[]
  }

  const activeContracts = allContracts.filter((contract) =>
    ['active', 'in_review', 'funded'].includes(contract.state)
  )
  const completedContracts = allContracts.filter(
    (contract) => contract.state === 'complete'
  )

  const escrowHeld = activeContracts.reduce((sum, contract) => {
    const unpaid = (contract.milestones ?? [])
      .filter((milestone) => milestone.state !== 'paid')
      .reduce((subtotal, milestone) => subtotal + milestone.amount, 0)

    return sum + unpaid
  }, 0)

  const pendingActions = [
    ...allContracts
      .filter(
        (contract) => contract.state === 'pending' && contract.initiator_id === user.id
      )
      .map((contract) => ({
        title: contract.title,
        description: 'Waiting for counterparty to sign',
        href: `/contracts/${contract.id}`,
        variant: 'warning' as const,
        label: 'Awaiting signature',
      })),
    ...allContracts
      .filter(
        (contract) =>
          contract.state === 'pending' && contract.counterparty_id === user.id
      )
      .map((contract) => ({
        title: contract.title,
        description: 'You need to review and sign this contract',
        href: `/contracts/${contract.id}`,
        variant: 'accent' as const,
        label: 'Action needed',
      })),
    ...allContracts
      .filter(
        (contract) => contract.state === 'in_review' && contract.initiator_id === user.id
      )
      .map((contract) => ({
        title: contract.title,
        description: 'A milestone delivery is waiting for your review',
        href: `/contracts/${contract.id}`,
        variant: 'warning' as const,
        label: 'Review delivery',
      })),
    ...allContracts
      .filter((contract) => contract.state === 'disputed')
      .map((contract) => ({
        title: contract.title,
        description: 'This contract has an active dispute',
        href: `/contracts/${contract.id}`,
        variant: 'danger' as const,
        label: 'Dispute open',
      })),
  ].slice(0, 5)

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile.full_name.split(' ')[0]}`}
        subtitle="Here's what's happening with your contracts."
        actions={
          <Link
            href="/contracts/new"
            className={cn(
              buttonVariants({ variant: 'primary', size: 'md' }),
              'whitespace-nowrap'
            )}
          >
            <Plus size={15} />
            <span>New contract</span>
          </Link>
        }
      />

      {/* Quick action cards — bento grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Active contracts"
          value={activeContracts.length}
          sub={
            activeContracts.length === 1
              ? '1 in progress'
              : `${activeContracts.length} in progress`
          }
          icon={<FileText size={14} className="text-[hsl(var(--color-accent))]" />}
          accentColor="accent"
        />
        <MetricCard
          label="Escrow held"
          value={formatCurrency(escrowHeld, 'USD')}
          sub="Across active contracts"
          icon={<DollarSign size={14} className="text-[hsl(var(--color-success))]" />}
          accentColor="success"
        />
        <MetricCard
          label="Completed"
          value={completedContracts.length}
          sub="All time"
          trend={completedContracts.length > 0 ? 'up' : 'neutral'}
          icon={<CheckCircle size={14} className="text-[hsl(var(--color-success))]" />}
          accentColor="success"
        />
        <MetricCard
          label="Trust score"
          value={profile.trust_score}
          sub={
            profile.trust_score >= 90
              ? 'Excellent standing'
              : profile.trust_score >= 75
                ? 'Good standing'
                : 'Needs attention'
          }
          trend={profile.trust_score >= 75 ? 'up' : 'down'}
          icon={<Shield size={14} className="text-[hsl(var(--color-gold))]" />}
          accentColor="gold"
        />
      </div>

      {/* Main content grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent contracts */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Recent contracts
            </h2>
            <Link
              href="/contracts"
              className="group flex items-center gap-1 text-xs text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-accent))]"
            >
              View all{' '}
              <ArrowRight
                size={11}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {allContracts.length === 0 ? (
            <EmptyState
              icon={<FileText size={22} />}
              title="No contracts yet"
              description="Create your first contract to get started with escrow protection."
              action={{
                label: 'Create contract',
                href: '/contracts/new',
                icon: <Plus size={14} />,
              }}
              size="sm"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {recentContracts.map((contract, index) => (
                <div
                  key={contract.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <ContractCard contract={contract} compact />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending actions */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Pending actions
            </h2>
            {pendingActions.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--color-warning-dim))] px-1.5 text-2xs font-bold text-[hsl(var(--color-warning))]">
                {pendingActions.length}
              </span>
            )}
          </div>

          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--color-border))] px-6 py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--color-success-dim))]">
                <CheckCircle
                  size={18}
                  className="text-[hsl(var(--color-success))]"
                />
              </div>
              <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                All caught up
              </p>
              <p className="text-xs text-[hsl(var(--color-text-3))]">
                No actions waiting for you.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingActions.map((action, index) => (
                <div
                  key={`${action.href}-${index}`}
                  className="animate-slide-in-right"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <PendingActionCard {...action} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div>
          <h2 className="mb-5 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Recent activity
          </h2>
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
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
        </div>
      )}
    </div>
  )
}
