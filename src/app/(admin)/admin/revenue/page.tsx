import { ArrowUpRight, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/ui/card'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDateTime } from '@/lib/utils/format-date'

export const metadata = { title: 'Revenue \u00b7 Admin' }

export default async function AdminRevenuePage() {
  await requireAdmin('admin')

  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from('payments')
    .select('gross_amount, net_amount, payment_type, provider, created_at, currency')
    .eq('provider_status', 'success')

  const payments = data ?? []

  const totalRevenue = payments
    .filter((payment) => payment.payment_type === 'platform_fee')
    .reduce((sum, payment) => sum + payment.net_amount, 0)
  const totalEscrow = payments
    .filter((payment) => payment.payment_type === 'escrow_deposit')
    .reduce((sum, payment) => sum + payment.gross_amount, 0)
  const totalReleased = payments
    .filter((payment) => payment.payment_type === 'milestone_release')
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentRevenue = payments
    .filter(
      (payment) =>
        payment.payment_type === 'platform_fee' &&
        new Date(payment.created_at).getTime() > thirtyDaysAgo.getTime()
    )
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  const byProvider = payments
    .filter((payment) => payment.payment_type === 'escrow_deposit')
    .reduce<Record<string, number>>((acc, payment) => {
      acc[payment.provider] = (acc[payment.provider] ?? 0) + payment.gross_amount
      return acc
    }, {})

  const providerTotal = Object.values(byProvider).reduce((sum, value) => sum + value, 0)
  const recentFees = payments
    .filter((payment) => payment.payment_type === 'platform_fee')
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )
    .slice(0, 20)

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="Platform fee earnings and escrow volume"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total revenue"
          value={formatCurrency(totalRevenue, 'USD')}
          sub="All time platform fees"
          trend="up"
          icon={<TrendingUp size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Last 30 days"
          value={formatCurrency(recentRevenue, 'USD')}
          sub="Successful fee capture"
          icon={<DollarSign size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Escrow volume"
          value={formatCurrency(totalEscrow, 'USD')}
          sub="Successful deposits"
          icon={<ArrowUpRight size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Released to service providers"
          value={formatCurrency(totalReleased, 'USD')}
          sub="Milestone payouts"
          icon={<CreditCard size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          className={cn(
            'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] p-5'
          )}
        >
          <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Escrow by provider
          </h2>
          <div className="flex flex-col gap-3">
            {Object.entries(byProvider)
              .sort(([, left], [, right]) => right - left)
              .map(([provider, amount]) => {
                const pct =
                  providerTotal > 0 ? Math.round((amount / providerTotal) * 100) : 0

                return (
                  <div key={provider}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="capitalize text-[hsl(var(--color-text-2))]">
                        {provider.replaceAll('_', ' ')}
                      </span>
                      <span className="font-medium text-[hsl(var(--color-text-1))]">
                        {formatCurrency(amount, 'USD')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--color-accent))]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            {Object.keys(byProvider).length === 0 && (
              <p className="text-xs text-[hsl(var(--color-text-3))]">
                No transactions yet.
              </p>
            )}
          </div>
        </div>

        <div
          className={cn(
            'lg:col-span-2 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] p-5'
          )}
        >
          <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Recent fee transactions
          </h2>
          {recentFees.length === 0 ? (
            <p className="text-xs text-[hsl(var(--color-text-3))]">
              No fee transactions yet.
            </p>
          ) : (
            <div className="flex flex-col gap-0">
              {recentFees.map((payment, index) => (
                <div
                  key={`${payment.provider}-${payment.created_at}-${index}`}
                  className={cn(
                    'flex items-center justify-between border-b border-[hsl(var(--color-border))] py-3',
                    'last:border-0'
                  )}
                >
                  <div>
                    <p className="text-xs capitalize text-[hsl(var(--color-text-2))]">
                      {payment.provider.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[hsl(var(--color-success))]">
                    +{formatCurrency(payment.net_amount, payment.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
