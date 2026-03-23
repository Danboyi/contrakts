import { redirect, notFound } from 'next/navigation'
import { ArrowUpRight, DollarSign, Shield } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { PaymentHistory } from '@/components/payments/payment-history'
import { MetricCard } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Payment } from '@/types'

export const metadata = { title: 'Payments' }

export default async function PaymentLedgerPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, title, ref_code, currency, initiator_id, counterparty_id')
    .eq('id', params.id)
    .single()

  if (!contract) {
    notFound()
  }

  const isParty =
    contract.initiator_id === user.id || contract.counterparty_id === user.id

  if (!isParty) {
    notFound()
  }

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('contract_id', params.id)
    .order('created_at', { ascending: false })

  const paymentList = (payments ?? []) as Payment[]
  const currency = contract.currency

  const deposited = paymentList
    .filter(
      (payment) =>
        payment.payment_type === 'escrow_deposit' &&
        payment.provider_status === 'success'
    )
    .reduce((sum, payment) => sum + payment.gross_amount, 0)

  const released = paymentList
    .filter(
      (payment) =>
        payment.payment_type === 'milestone_release' &&
        payment.provider_status === 'success'
    )
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  const fees = paymentList
    .filter((payment) => payment.payment_type === 'platform_fee')
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  return (
    <div>
      <PageHeader
        title="Payment ledger"
        subtitle={`${contract.ref_code} \u00b7 ${contract.title}`}
        back={{ label: 'Back to contract', href: `/contracts/${params.id}` }}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Total deposited"
          value={formatCurrency(deposited, currency)}
          sub="Into escrow"
          icon={<Shield size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Released to service provider"
          value={formatCurrency(released, currency)}
          sub="Milestone payments"
          trend="up"
          icon={<ArrowUpRight size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
        <MetricCard
          label="Platform fees"
          value={formatCurrency(fees, currency)}
          sub="2% per milestone"
          icon={<DollarSign size={14} className="text-[hsl(var(--color-text-3))]" />}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
        <h2 className="mb-5 text-sm font-semibold text-[hsl(var(--color-text-1))]">
          All transactions
        </h2>
        <PaymentHistory payments={paymentList} currency={currency} />
      </div>
    </div>
  )
}
