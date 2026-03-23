import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess, withApiAuth } from '@/lib/api/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeUrl } from '@/lib/utils/sanitize'

const WEBHOOK_EVENTS = [
  'contract.created',
  'contract.signed',
  'contract.funded',
  'contract.complete',
  'contract.voided',
  'milestone.submitted',
  'milestone.approved',
  'payment.released',
  'payment.failed',
  'dispute.raised',
  'dispute.resolved',
] as const

const CreateWebhookSchema = z.object({
  url: z.string().url('Enter a valid HTTPS URL'),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
})

const getHandler = withApiAuth(async (_req, ctx) => {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('webhook_subscriptions')
    .select('id, url, events, is_active, created_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess(data ?? [])
}, 'webhooks:manage')

const postHandler = withApiAuth(async (req, ctx) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body.', 400)
  }

  const parsed = CreateWebhookSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 422)
  }

  let sanitizedUrl: string
  try {
    sanitizedUrl = sanitizeUrl(parsed.data.url)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Webhook URL must use HTTPS.',
      422
    )
  }

  const supabaseAdmin = createAdminClient()
  const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`

  const { data, error } = await supabaseAdmin
    .from('webhook_subscriptions')
    .insert({
      user_id: ctx.userId,
      url: sanitizedUrl,
      events: parsed.data.events,
      secret,
      is_active: true,
    })
    .select('id, url, events, is_active, created_at')
    .single()

  if (error || !data) {
    return apiError('Failed to create webhook.', 500)
  }

  return apiSuccess(
    {
      ...data,
      secret,
    },
    201
  )
}, 'webhooks:manage')

export async function GET(req: NextRequest) {
  return getHandler(req)
}

export async function POST(req: NextRequest) {
  return postHandler(req)
}
