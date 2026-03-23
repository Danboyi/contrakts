import { NextRequest, NextResponse } from 'next/server'
import {
  type PaystackCharge,
  type PaystackEvent,
  type PaystackTransfer,
  verifyPaystackWebhook,
} from '@/lib/paystack/webhooks'
import {
  markEscrowDepositSuccess,
  markTransferFailed,
  markTransferSuccess,
} from '@/lib/payments/workflows'
import { markDisputeFeePaid as markVerifiedDisputeFeePaid } from '@/lib/disputes/workflows'
import { checkRateLimit, webhookRatelimit } from '@/lib/utils/rate-limit'

export async function POST(req: NextRequest) {
  const ipHeader =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    'webhook'
  const ip = ipHeader.split(',')[0]?.trim() || 'webhook'
  const webhookLimit = await checkRateLimit(
    webhookRatelimit,
    `paystack:${ip}`
  )

  if (!webhookLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  if (!verifyPaystackWebhook(body, signature)) {
    console.error('[Paystack Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: PaystackEvent
  try {
    event = JSON.parse(body) as PaystackEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (event.event === 'charge.success') {
      await handleChargeSuccess(event.data)
    }

    if (event.event === 'transfer.success') {
      await handleTransferSuccess(event.data)
    }

    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      await handleTransferFailed(event.data)
    }
  } catch (error) {
    console.error('[Paystack Webhook] Handler error:', error)
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

async function handleChargeSuccess(charge: PaystackCharge) {
  const contractId = charge.metadata?.contract_id
  const disputeId = charge.metadata?.dispute_id
  const paymentType = charge.metadata?.payment_type

  if (paymentType === 'dispute_fee' && disputeId) {
    await markVerifiedDisputeFeePaid({
      disputeId,
      reference: charge.reference,
      amount: charge.amount,
      currency: charge.currency,
    })
    return
  }

  if (!contractId || paymentType !== 'escrow_deposit') {
    return
  }

  await markEscrowDepositSuccess({
    provider: 'paystack',
    providerRef: charge.reference,
    amount: charge.amount,
    currency: charge.currency,
    contractId,
  })
}

async function handleTransferSuccess(transfer: PaystackTransfer) {
  await markTransferSuccess({
    providerRef: transfer.reference,
    amount: transfer.amount,
    status: transfer.status,
  })
}

async function handleTransferFailed(transfer: PaystackTransfer) {
  await markTransferFailed({
    providerRef: transfer.reference,
    status: transfer.status,
  })
}
