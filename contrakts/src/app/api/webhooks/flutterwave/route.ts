import { NextRequest, NextResponse } from 'next/server'
import { verifyFlutterwaveWebhook } from '@/lib/flutterwave/webhooks'
import {
  markEscrowDepositSuccess,
  markTransferFailed,
  markTransferSuccess,
} from '@/lib/payments/workflows'
import { checkRateLimit, webhookRatelimit } from '@/lib/utils/rate-limit'

type FlutterwaveWebhookEvent = {
  event: string
  data: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const ipHeader =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    'webhook'
  const ip = ipHeader.split(',')[0]?.trim() || 'webhook'
  const webhookLimit = await checkRateLimit(
    webhookRatelimit,
    `flutterwave:${ip}`
  )

  if (!webhookLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await req.text()
  const signature = req.headers.get('verif-hash') ?? ''

  if (!verifyFlutterwaveWebhook(body, signature)) {
    console.error('[Flutterwave Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: FlutterwaveWebhookEvent
  try {
    event = JSON.parse(body) as FlutterwaveWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data = event.data

  if (event.event === 'charge.completed') {
    const status = String(data.status ?? '')
    if (status !== 'successful') {
      return NextResponse.json({ received: true })
    }

    const meta = (data.meta ?? {}) as {
      contract_id?: string
      payment_type?: string
    }

    if (!meta.contract_id || meta.payment_type !== 'escrow_deposit') {
      return NextResponse.json({ received: true })
    }

    await markEscrowDepositSuccess({
      provider: 'flutterwave',
      providerRef: String(data.tx_ref ?? ''),
      amount: Math.round(Number(data.amount ?? 0) * 100),
      currency: String(data.currency ?? 'USD'),
      contractId: meta.contract_id,
    })
  }

  if (event.event === 'transfer.completed') {
    const status = String(data.status ?? '')

    if (status === 'SUCCESSFUL') {
      await markTransferSuccess({
        providerRef: String(data.reference ?? ''),
        amount: Math.round(Number(data.amount ?? 0) * 100),
        status,
      })
    } else {
      await markTransferFailed({
        providerRef: String(data.reference ?? ''),
        status,
      })
    }
  }

  return NextResponse.json({ received: true })
}
