import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess, withApiAuth } from '@/lib/api/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

const ToggleWebhookSchema = z.object({
  is_active: z.boolean(),
})

const deleteHandler = withApiAuth(async (_req, ctx, params) => {
  const id = params?.id
  if (!id) {
    return apiError('Webhook ID required.', 400)
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('webhook_subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select('id')
    .maybeSingle()

  if (error) {
    return apiError(error.message, 500)
  }

  if (!data) {
    return apiError('Webhook not found.', 404)
  }

  return apiSuccess({ deleted: true })
}, 'webhooks:manage')

const patchHandler = withApiAuth(async (req, ctx, params) => {
  const id = params?.id
  if (!id) {
    return apiError('Webhook ID required.', 400)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body.', 400)
  }

  const parsed = ToggleWebhookSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 422)
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('webhook_subscriptions')
    .update({ is_active: parsed.data.is_active })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select('id, url, events, is_active, created_at')
    .maybeSingle()

  if (error) {
    return apiError(error.message, 500)
  }

  if (!data) {
    return apiError('Webhook not found.', 404)
  }

  return apiSuccess(data)
}, 'webhooks:manage')

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteHandler(req, params)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return patchHandler(req, params)
}
