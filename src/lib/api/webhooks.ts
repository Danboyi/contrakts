import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/supabase'

export interface WebhookPayload {
  id: string
  event: string
  created_at: string
  data: Record<string, unknown>
}

export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signed = `${timestamp}.${payload}`
  return crypto.createHmac('sha256', secret).update(signed).digest('hex')
}

export async function dispatchWebhookEvent(
  userId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  const supabaseAdmin = createAdminClient()
  const { data: subscriptions } = await supabaseAdmin
    .from('webhook_subscriptions')
    .select('id, url, secret, events')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!subscriptions || subscriptions.length === 0) {
    return
  }

  const matching = subscriptions.filter(
    (subscription) =>
      subscription.events.includes(eventType) ||
      subscription.events.includes('*')
  )

  if (matching.length === 0) {
    return
  }

  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event: eventType,
    created_at: new Date().toISOString(),
    data,
  }

  const payloadStr = JSON.stringify(payload)

  await Promise.allSettled(
    matching.map((subscription) =>
      deliverWebhook(subscription, payloadStr, eventType, payload)
    )
  )
}

async function deliverWebhook(
  subscription: {
    id: string
    url: string
    secret: string
  },
  payloadStr: string,
  eventType: string,
  payload: WebhookPayload
): Promise<void> {
  const supabaseAdmin = createAdminClient()
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signWebhookPayload(
    payloadStr,
    subscription.secret,
    timestamp
  )

  const { data: delivery } = await supabaseAdmin
    .from('webhook_deliveries')
    .insert({
      subscription_id: subscription.id,
      event_type: eventType,
      payload: payload as unknown as Json,
    })
    .select('id')
    .single()

  try {
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Contrakts-Signature': signature,
        'X-Contrakts-Timestamp': String(timestamp),
        'X-Contrakts-Event': eventType,
        'X-Contrakts-Delivery': delivery?.id ?? '',
        'User-Agent': 'Contrakts-Webhooks/1.0',
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10000),
    })

    const responseBody = await response.text().catch(() => '')

    if (delivery) {
      await supabaseAdmin
        .from('webhook_deliveries')
        .update({
          response_status: response.status,
          response_body: responseBody.slice(0, 1000),
          delivered_at: response.ok ? new Date().toISOString() : null,
          failed_at: response.ok ? null : new Date().toISOString(),
          next_retry_at: response.ok
            ? null
            : new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq('id', delivery.id)
    }
  } catch (error) {
    if (delivery) {
      await supabaseAdmin
        .from('webhook_deliveries')
        .update({
          response_status: 0,
          response_body:
            error instanceof Error ? error.message : 'Network error',
          failed_at: new Date().toISOString(),
          next_retry_at: new Date(
            Date.now() + 5 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', delivery.id)
    }
  }
}

export async function notifyContractEvent(
  contractId: string,
  eventType: string,
  extraData?: Record<string, unknown>
): Promise<void> {
  const supabaseAdmin = createAdminClient()
  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('initiator_id, counterparty_id, ref_code, title, state')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) {
    return
  }

  const eventData = {
    contract_id: contractId,
    ref_code: contract.ref_code,
    title: contract.title,
    state: contract.state,
    ...extraData,
  }

  const parties = [contract.initiator_id, contract.counterparty_id].filter(
    (value): value is string => Boolean(value)
  )

  await Promise.allSettled(
    parties.map((userId) => dispatchWebhookEvent(userId, eventType, eventData))
  )
}
