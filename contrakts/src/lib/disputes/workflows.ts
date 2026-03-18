import { createAdminClient } from '@/lib/supabase/admin'
import { insertNotifications } from '@/lib/notifications/store'

const DISPUTE_FEE_USD_CENTS = 1500

export async function markDisputeFeePaid(params: {
  disputeId: string
  reference: string
  amount: number
  currency: string
}) {
  const supabaseAdmin = createAdminClient()
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('id, contract_id, raised_by, dispute_fee_paid')
    .eq('id', params.disputeId)
    .maybeSingle()

  if (!dispute || dispute.dispute_fee_paid) {
    return
  }

  if (params.amount < DISPUTE_FEE_USD_CENTS || params.currency !== 'USD') {
    return
  }

  await supabaseAdmin
    .from('disputes')
    .update({ dispute_fee_paid: true })
    .eq('id', dispute.id)

  await supabaseAdmin.from('audit_log').insert({
    contract_id: dispute.contract_id,
    actor_id: dispute.raised_by,
    event_type: 'dispute.fee_paid',
    payload: {
      dispute_id: dispute.id,
      reference: params.reference,
      amount: params.amount,
      currency: params.currency,
    },
  })

  await insertNotifications({
    user_id: dispute.raised_by,
    contract_id: dispute.contract_id,
    type: 'dispute_fee_paid',
    title: 'Dispute fee received',
    body: 'Your dispute fee was confirmed. Arbitration can proceed once all evidence is in.',
  })
}
