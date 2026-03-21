import { NextRequest, NextResponse } from 'next/server'
import { verifyCoinbaseWebhook } from '@/lib/coinbase/webhooks'
import {
  markEscrowDepositSuccess,
  markPaymentFailed,
} from '@/lib/payments/workflows'
import { checkRateLimit, webhookRatelimit } from '@/lib/utils/rate-limit'

type CoinbaseWebhookPayload = {
  event: {
    type: string
    data: {
      id: string
      code: string
      metadata: { contract_id?: string; payment_type?: string }
      pricing: { local: { amount: string; currency: string } }
    }
  }
}

export async function POST(req: NextRequest) {
  const ipHeader =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    'webhook'
  const ip = ipHeader.split(',')[0]?.trim() || 'webhook'
  const webhookLimit = await checkRateLimit(
    webhookRatelimit,
    `coinbase:${ip}`
  )

  if (!webhookLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-cc-webhook-signature') ?? ''

  if (!verifyCoinbaseWebhook(body, signature)) {
    console.error('[Coinbase Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let payload: CoinbaseWebhookPayload
  try {
    payload = JSON.parse(body) as CoinbaseWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = payload.event

  if (type === 'charge:confirmed') {
    const contractId = data.metadata?.contract_id
    const paymentType = data.metadata?.payment_type

    if (!contractId || paymentType !== 'escrow_deposit') {
      return NextResponse.json({ received: true })
    }

    await markEscrowDepositSuccess({
      provider: 'coinbase_commerce',
      providerRef: data.code,
      amount: Math.round(Number.parseFloat(data.pricing.local.amount) * 100),
      currency: data.pricing.local.currency,
      contractId,
    })
  }

  if (type === 'charge:failed') {
    await markPaymentFailed({
      providerRef: data.code,
      status: 'failed',
    })
  }

  return NextResponse.json({ received: true })
}
