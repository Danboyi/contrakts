import { createAdminClient } from '@/lib/supabase/admin'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { sendContractFundedEmails } from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
import { syncTrustScore } from '@/lib/profile/trust'

interface DepositSuccessInput {
  provider: 'paystack' | 'flutterwave' | 'coinbase_commerce'
  providerRef: string
  amount: number
  currency: string
  contractId: string
}

interface TransferStateInput {
  providerRef: string
  amount?: number
  status: string
}

async function notifyContractParties(params: {
  contractId: string
  type: string
  title: string
  body: string
}) {
  const supabaseAdmin = createAdminClient()
  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('initiator_id, counterparty_id')
    .eq('id', params.contractId)
    .maybeSingle()

  if (!contract) {
    return
  }

  const notifications = [contract.initiator_id, contract.counterparty_id]
    .filter((value): value is string => Boolean(value))
    .map((userId) => ({
      user_id: userId,
      contract_id: params.contractId,
      type: params.type,
      title: params.title,
      body: params.body,
    }))

  if (notifications.length > 0) {
    await insertNotifications(notifications)
  }
}

export async function markEscrowDepositSuccess({
  provider,
  providerRef,
  amount,
  currency,
  contractId,
}: DepositSuccessInput) {
  const supabaseAdmin = createAdminClient()
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, provider_status, payment_type')
    .eq('provider_ref', providerRef)
    .maybeSingle()

  if (!payment || payment.payment_type !== 'escrow_deposit') {
    return
  }

  if (payment.provider_status === 'success') {
    return
  }

  await supabaseAdmin
    .from('payments')
    .update({
      provider_status: 'success',
      gross_amount: amount,
      net_amount: amount,
      currency,
    })
    .eq('id', payment.id)

  await supabaseAdmin
    .from('contracts')
    .update({
      state: 'funded',
      funded_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .in('state', ['pending', 'draft'])

  const { data: milestones } = await supabaseAdmin
    .from('milestones')
    .select('id')
    .eq('contract_id', contractId)
    .eq('state', 'pending')
    .order('order_index', { ascending: true })
    .limit(1)

  if (milestones?.[0]) {
    await supabaseAdmin
      .from('milestones')
      .update({ state: 'in_progress' })
      .eq('id', milestones[0].id)
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contractId,
    event_type: 'contract.funded',
    payload: {
      provider,
      reference: providerRef,
      amount,
      currency,
    },
  })

  await notifyContractEvent(contractId, 'contract.funded', {
    provider,
  }).catch(console.error)

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('title')
    .eq('id', contractId)
    .maybeSingle()

  if (contract) {
    await notifyContractParties({
      contractId,
      type: 'contract_funded',
      title: provider === 'coinbase_commerce' ? 'Escrow funded (crypto)' : 'Escrow funded',
      body:
        provider === 'coinbase_commerce'
          ? `Crypto escrow for "${contract.title}" confirmed on-chain.`
          : `Escrow for "${contract.title}" has been funded. Work can now begin.`,
    })
  }

  await sendContractFundedEmails(contractId).catch(console.error)
}

export async function markTransferSuccess({
  providerRef,
  amount,
}: TransferStateInput) {
  const supabaseAdmin = createAdminClient()
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, contract_id, milestone_id, payment_type, provider_status')
    .eq('provider_ref', providerRef)
    .maybeSingle()

  if (!payment) {
    return
  }

  if (payment.provider_status === 'success') {
    return
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_status: 'success' })
    .eq('id', payment.id)

  if (!payment.milestone_id || payment.payment_type !== 'milestone_release') {
    return
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_status: 'success' })
    .eq('contract_id', payment.contract_id)
    .eq('milestone_id', payment.milestone_id)
    .eq('payment_type', 'platform_fee')
    .eq('provider_status', 'pending')

  await supabaseAdmin
    .from('milestones')
    .update({
      state: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payment.milestone_id)

  await supabaseAdmin.from('audit_log').insert({
    contract_id: payment.contract_id,
    event_type: 'payment.released',
    payload: {
      milestone_id: payment.milestone_id,
      amount: amount ?? null,
      reference: providerRef,
    },
  })

  await notifyContractEvent(payment.contract_id, 'payment.released', {
    milestone_id: payment.milestone_id,
    amount: amount ?? null,
  }).catch(console.error)

  const { data: paidMilestone } = await supabaseAdmin
    .from('milestones')
    .select('title')
    .eq('id', payment.milestone_id)
    .maybeSingle()
  const { data: paidContract } = await supabaseAdmin
    .from('contracts')
    .select('initiator_id, counterparty_id, title')
    .eq('id', payment.contract_id)
    .maybeSingle()

  if (paidContract) {
    await insertNotifications([
      {
        user_id: paidContract.initiator_id,
        contract_id: payment.contract_id,
        type: 'milestone_approved',
        title: 'Milestone approved',
        body: `${paidMilestone?.title ?? 'A milestone'} has been approved and payment release has been initiated.`,
      },
      ...(paidContract.counterparty_id
        ? [
            {
              user_id: paidContract.counterparty_id,
              contract_id: payment.contract_id,
              type: 'payment_released',
              title: 'Payment released',
              body: `Payment for ${paidMilestone?.title ?? 'your milestone'} has been released to your payout account.`,
            },
          ]
        : []),
    ])
  }

  const { data: remaining } = await supabaseAdmin
    .from('milestones')
    .select('id')
    .eq('contract_id', payment.contract_id)
    .neq('state', 'paid')

  if (!remaining || remaining.length === 0) {
    await supabaseAdmin
      .from('contracts')
      .update({
        state: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payment.contract_id)

    await supabaseAdmin.from('audit_log').insert({
      contract_id: payment.contract_id,
      event_type: 'contract.complete',
      payload: {},
    })

    await notifyContractEvent(payment.contract_id, 'contract.complete').catch(
      console.error
    )

    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('initiator_id, counterparty_id')
      .eq('id', payment.contract_id)
      .maybeSingle()

    if (contract) {
      const participantIds = [contract.initiator_id, contract.counterparty_id].filter(
        (value): value is string => Boolean(value)
      )

      await Promise.all(participantIds.map((userId) => syncTrustScore(userId)))

      await insertNotifications(
        participantIds
          .map((userId) => ({
            user_id: userId,
            contract_id: payment.contract_id,
            type: 'contract_complete',
            title: 'Contract complete',
            body: 'All milestones are paid. This contract is now complete.',
          }))
      )
    }

    return
  }

  const { data: nextMilestones } = await supabaseAdmin
    .from('milestones')
    .select('id')
    .eq('contract_id', payment.contract_id)
    .eq('state', 'pending')
    .order('order_index', { ascending: true })
    .limit(1)

  if (nextMilestones?.[0]) {
    await supabaseAdmin
      .from('milestones')
      .update({ state: 'in_progress' })
      .eq('id', nextMilestones[0].id)
  }

  await supabaseAdmin
    .from('contracts')
    .update({ state: 'active' })
    .eq('id', payment.contract_id)
}

export async function markTransferFailed({
  providerRef,
  status,
}: TransferStateInput) {
  const supabaseAdmin = createAdminClient()
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, contract_id, milestone_id, provider_status')
    .eq('provider_ref', providerRef)
    .maybeSingle()

  if (!payment) {
    return
  }

  if (payment.provider_status === 'failed') {
    return
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_status: 'failed' })
    .eq('id', payment.id)

  if (payment.milestone_id) {
    await supabaseAdmin
      .from('payments')
      .update({ provider_status: 'failed' })
      .eq('contract_id', payment.contract_id)
      .eq('milestone_id', payment.milestone_id)
      .eq('payment_type', 'platform_fee')
      .eq('provider_status', 'pending')
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('initiator_id, title')
    .eq('id', payment.contract_id)
    .maybeSingle()

  if (contract) {
    await insertNotifications({
      user_id: contract.initiator_id,
      contract_id: payment.contract_id,
      type: 'payment_failed',
      title: 'Payment transfer failed',
      body: `A milestone payment for "${contract.title}" failed and now requires manual review.`,
    })
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: payment.contract_id,
    event_type: 'payment.failed',
    payload: {
      reference: providerRef,
      status,
      milestone_id: payment.milestone_id,
    },
  })

  await notifyContractEvent(payment.contract_id, 'payment.failed', {
    reference: providerRef,
    milestone_id: payment.milestone_id,
  }).catch(console.error)
}

export async function markPaymentFailed({
  providerRef,
  status,
}: TransferStateInput) {
  const supabaseAdmin = createAdminClient()
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, contract_id, payment_type, provider_status')
    .eq('provider_ref', providerRef)
    .maybeSingle()

  if (!payment || payment.provider_status === 'failed') {
    return
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_status: 'failed' })
    .eq('id', payment.id)

  await supabaseAdmin.from('audit_log').insert({
    contract_id: payment.contract_id,
    event_type: 'payment.failed',
    payload: {
      reference: providerRef,
      status,
      payment_type: payment.payment_type,
    },
  })

  await notifyContractEvent(payment.contract_id, 'payment.failed', {
    reference: providerRef,
    payment_type: payment.payment_type,
  }).catch(console.error)

  if (payment.payment_type === 'escrow_deposit') {
    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('initiator_id, title')
      .eq('id', payment.contract_id)
      .maybeSingle()

    if (contract) {
      await insertNotifications({
        user_id: contract.initiator_id,
        contract_id: payment.contract_id,
        type: 'payment_failed',
        title: 'Escrow funding failed',
        body: `A funding attempt for "${contract.title}" failed. You can try again from the contract page.`,
      })
    }
  }
}
