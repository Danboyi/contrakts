'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { insertNotifications } from '@/lib/notifications/store'
import { createCryptoCharge } from '@/lib/coinbase/client'
import { flwInitializePayment } from '@/lib/flutterwave/client'
import { paystackInitialize, paystackTransfer } from '@/lib/paystack/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { fromSmallestUnit } from '@/lib/utils/format-currency'

export type FundEscrowResult = {
  error?: string
  paymentUrl?: string
  provider?: string
}

export type PaymentMethod = 'paystack' | 'flutterwave' | 'crypto'

export async function fundEscrow(
  contractId: string,
  paymentMethod: PaymentMethod
): Promise<FundEscrowResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  if (contract.initiator_id !== user.id) {
    return { error: 'Only the contract initiator can fund escrow.' }
  }

  if (!['pending', 'draft'].includes(contract.state)) {
    return { error: 'This contract cannot be funded in its current state.' }
  }

  if (!contract.signed_initiator_at || !contract.signed_counterparty_at) {
    return { error: 'Both parties must sign before escrow can be funded.' }
  }

  if (paymentMethod === 'paystack' && !['NGN', 'USD'].includes(contract.currency)) {
    return { error: 'Paystack funding is only available for NGN and USD contracts.' }
  }

  const { data: initiator } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  if (!initiator) {
    return { error: 'Initiator profile not found.' }
  }

  const reference = nanoid(20)
  const appUrl = getAppUrl()
  const callbackUrl = `${appUrl}/contracts/${contractId}?funded=1`
  const cancelUrl = `${appUrl}/contracts/${contractId}`
  const amountHuman = fromSmallestUnit(contract.total_value)

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      contract_id: contractId,
      payment_type: 'escrow_deposit',
      provider: paymentMethod === 'crypto' ? 'coinbase_commerce' : paymentMethod,
      provider_ref: reference,
      provider_status: 'pending',
      gross_amount: contract.total_value,
      fee_amount: 0,
      net_amount: contract.total_value,
      currency: contract.currency,
      metadata: {
        payment_method: paymentMethod,
      },
    })
    .select()
    .single()

  if (paymentError || !payment) {
    return { error: 'Failed to create payment record.' }
  }

  try {
    let paymentUrl = ''

    if (paymentMethod === 'paystack') {
      const init = await paystackInitialize({
        email: initiator.email,
        amount: contract.total_value,
        reference,
        callback_url: callbackUrl,
        currency: contract.currency,
        metadata: {
          contract_id: contractId,
          payment_type: 'escrow_deposit',
          payment_id: payment.id,
        },
      })
      paymentUrl = init.authorization_url
    } else if (paymentMethod === 'flutterwave') {
      const init = await flwInitializePayment({
        tx_ref: reference,
        amount: amountHuman,
        currency: contract.currency,
        redirect_url: callbackUrl,
        customer: {
          email: initiator.email,
          name: initiator.full_name,
        },
        meta: {
          contract_id: contractId,
          payment_type: 'escrow_deposit',
          payment_id: payment.id,
        },
      })
      paymentUrl = init.link
    } else {
      const charge = await createCryptoCharge({
        name: `Escrow: ${contract.title}`,
        description: `Escrow deposit for contract ${contract.ref_code}`,
        amount: amountHuman.toFixed(2),
        currency: 'USDC',
        metadata: {
          contract_id: contractId,
          payment_type: 'escrow_deposit',
        },
        redirect_url: callbackUrl,
        cancel_url: cancelUrl,
      })

      await supabaseAdmin
        .from('payments')
        .update({
          provider_ref: charge.code,
          metadata: {
            charge_id: charge.id,
            hosted_url: charge.hosted_url,
            expires_at: charge.expires_at,
            payment_method: paymentMethod,
          },
        })
        .eq('id', payment.id)

      paymentUrl = charge.hosted_url
    }

    await supabaseAdmin
      .from('contracts')
      .update({
        payment_method: paymentMethod === 'crypto' ? 'crypto' : 'fiat',
      })
      .eq('id', contractId)

    revalidatePath(`/contracts/${contractId}`)
    revalidatePath(`/contracts/${contractId}/payments`)

    return { paymentUrl, provider: paymentMethod }
  } catch (error) {
    await supabaseAdmin.from('payments').delete().eq('id', payment.id)
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Payment initialization failed.',
    }
  }
}

export async function releaseMilestonePayment(
  milestoneId: string,
  autoRelease = false,
  forceAdmin = false
): Promise<{ error?: string; success?: boolean }> {
  let requesterId: string | null = null

  if (!autoRelease && !forceAdmin) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated.' }
    }

    requesterId = user.id
  }

  const supabaseAdmin = createAdminClient()
  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (!milestone) {
    return { error: 'Milestone not found.' }
  }

  if (milestone.state !== 'submitted') {
    return { error: 'Milestone must be in submitted state to release payment.' }
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', milestone.contract_id)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  if (!autoRelease && !forceAdmin && requesterId !== contract.initiator_id) {
    return { error: 'Only the contract initiator can release milestone payments.' }
  }

  if (!contract.counterparty_id) {
    return { error: 'Counterparty is not attached to this contract.' }
  }

  const platformFeeAmount = Math.round(
    milestone.amount * (Number(contract.platform_fee_pct) / 100)
  )
  const vendorAmount = milestone.amount - platformFeeAmount

  await supabaseAdmin
    .from('milestones')
    .update({
      state: 'approved',
      approved_at: new Date().toISOString(),
      auto_released: autoRelease,
    })
    .eq('id', milestoneId)
    .eq('state', 'submitted')

  await supabaseAdmin
    .from('contracts')
    .update({ state: 'active' })
    .eq('id', contract.id)
    .eq('state', 'in_review')

  const { data: vendorProfile } = await supabaseAdmin
    .from('users')
    .select(
      'id, full_name, paystack_recipient_code, preferred_payout, wallet_address'
    )
    .eq('id', contract.counterparty_id)
    .single()

  if (!vendorProfile) {
    return { error: 'Vendor payout profile not found.' }
  }

  const payoutProvider =
    contract.payment_method === 'crypto' ||
    vendorProfile?.preferred_payout === 'crypto'
      ? 'coinbase_commerce'
      : 'paystack'

  const { data: vendorPayment, error: vendorPaymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      contract_id: contract.id,
      milestone_id: milestoneId,
      payment_type: 'milestone_release',
      provider: payoutProvider,
      provider_ref: null,
      provider_status: 'pending',
      gross_amount: milestone.amount,
      fee_amount: platformFeeAmount,
      net_amount: vendorAmount,
      currency: contract.currency,
      recipient_id: contract.counterparty_id,
      metadata: {
        auto_release: autoRelease,
      },
    })
    .select()
    .single()

  if (vendorPaymentError || !vendorPayment) {
    return { error: 'Could not create the payout record.' }
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_ref: vendorPayment.id })
    .eq('id', vendorPayment.id)

  await supabaseAdmin.from('payments').insert({
    contract_id: contract.id,
    milestone_id: milestoneId,
    payment_type: 'platform_fee',
    provider: payoutProvider,
    provider_ref: `fee_${vendorPayment.id}`,
    provider_status: 'pending',
    gross_amount: platformFeeAmount,
    fee_amount: 0,
    net_amount: platformFeeAmount,
    currency: contract.currency,
    metadata: {
      source_payment_id: vendorPayment.id,
    },
  })

  if (payoutProvider === 'coinbase_commerce') {
    await insertNotifications([
      {
        user_id: contract.initiator_id,
        contract_id: contract.id,
        type: 'crypto_payout_review',
        title: 'Crypto payout pending manual review',
        body: `Milestone "${milestone.title}" is approved. A manual crypto payout review is required before release.`,
      },
      {
        user_id: contract.counterparty_id,
        contract_id: contract.id,
        type: 'crypto_payout_review',
        title: 'Crypto payout pending',
        body: `Milestone "${milestone.title}" has been approved. Your payout will be reviewed before release.`,
      },
    ])
  } else if (!vendorProfile?.paystack_recipient_code) {
    await insertNotifications({
      user_id: contract.counterparty_id,
      contract_id: contract.id,
      type: 'bank_details_needed',
      title: 'Add bank details to receive payment',
      body: `Milestone "${milestone.title}" was approved. Add your bank account to receive ${vendorAmount} ${contract.currency}.`,
    })
  } else {
    try {
      await paystackTransfer({
        source: 'balance',
        amount: vendorAmount,
        recipient: vendorProfile.paystack_recipient_code,
        reason: `Milestone payment: ${milestone.title}`,
        reference: vendorPayment.id,
      })
    } catch (error) {
      await supabaseAdmin.from('audit_log').insert({
        contract_id: contract.id,
        event_type: 'payment.transfer_error',
        payload: {
          milestone_id: milestoneId,
          error: error instanceof Error ? error.message : 'Unknown',
          reference: vendorPayment.id,
        },
      })

      await insertNotifications({
        user_id: contract.initiator_id,
        contract_id: contract.id,
        type: 'transfer_failed',
        title: 'Transfer failed - manual review needed',
        body: `Payment for milestone "${milestone.title}" could not be transferred. Contact support.`,
      })
    }
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    event_type: 'milestone.approved',
    payload: {
      milestone_id: milestoneId,
      amount: milestone.amount,
      vendor_amount: vendorAmount,
      platform_fee: platformFeeAmount,
      auto_release: autoRelease,
    },
  })

  await notifyContractEvent(contract.id, 'milestone.approved', {
    milestone_id: milestoneId,
    auto_release: autoRelease,
  }).catch(console.error)

  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath(`/contracts/${contract.id}/payments`)
  return { success: true }
}

export async function refundDisputedMilestone(
  milestoneId: string,
  forceAdmin = false
): Promise<{ error?: string; success?: boolean }> {
  const supabaseAdmin = createAdminClient()
  let requesterId: string | null = null

  if (!forceAdmin) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated.' }
    }

    requesterId = user.id
  }

  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (!milestone) {
    return { error: 'Milestone not found.' }
  }

  if (milestone.state !== 'disputed') {
    return { error: 'Only disputed milestones can be queued for refund review.' }
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('id, title, currency, initiator_id, counterparty_id, payment_method')
    .eq('id', milestone.contract_id)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  if (!forceAdmin && contract.initiator_id !== requesterId) {
    return { error: 'Only the contract initiator can request a refund review.' }
  }

  const { data: existingRefund } = await supabaseAdmin
    .from('payments')
    .select('id, provider_status')
    .eq('milestone_id', milestoneId)
    .eq('payment_type', 'refund')
    .maybeSingle()

  if (existingRefund && existingRefund.provider_status !== 'failed') {
    return { error: 'A refund is already pending review for this milestone.' }
  }

  const provider = contract.payment_method === 'crypto' ? 'coinbase_commerce' : 'paystack'

  await supabaseAdmin.from('payments').insert({
    contract_id: contract.id,
    milestone_id: milestoneId,
    payment_type: 'refund',
    provider,
    provider_ref: `refund_${nanoid(12)}`,
    provider_status: 'pending',
    gross_amount: milestone.amount,
    fee_amount: 0,
    net_amount: milestone.amount,
    currency: contract.currency,
    recipient_id: contract.initiator_id,
    metadata: {
      review_required: true,
      reason: 'dispute_refund',
    },
  })

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: requesterId,
    event_type: 'refund.requested',
    payload: {
      milestone_id: milestoneId,
      amount: milestone.amount,
      review_required: true,
    },
  })

  const notifications = [
    {
      user_id: contract.initiator_id,
      contract_id: contract.id,
      type: 'refund_review',
      title: 'Refund review queued',
      body: `Refund review for "${contract.title}" has been queued for manual handling.`,
    },
    contract.counterparty_id
      ? {
          user_id: contract.counterparty_id,
          contract_id: contract.id,
          type: 'refund_review',
          title: 'Dispute refund under review',
          body: `A refund review has been opened for "${contract.title}". Contrakts will process the outcome manually.`,
        }
      : null,
  ].filter(
    (
      value
    ): value is {
      user_id: string
      contract_id: string
      type: string
      title: string
      body: string
    } => Boolean(value)
  )

  if (notifications.length > 0) {
    await insertNotifications(notifications)
  }

  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath(`/contracts/${contract.id}/payments`)

  return { success: true }
}
