import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess, withApiAuth } from '@/lib/api/middleware'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { releaseMilestonePayment } from '@/lib/payments/actions'
import { createAdminClient } from '@/lib/supabase/admin'

const getHandler = withApiAuth(async (_req, ctx, params) => {
  const id = params?.id
  if (!id) {
    return apiError('Milestone ID required.', 400)
  }

  const supabaseAdmin = createAdminClient()
  const { data: milestone, error } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !milestone) {
    return apiError('Milestone not found.', 404)
  }

  const [contractResult, deliverablesResult] = await Promise.all([
    supabaseAdmin
      .from('contracts')
      .select('id, initiator_id, counterparty_id, state, currency')
      .eq('id', milestone.contract_id)
      .maybeSingle(),
    supabaseAdmin
      .from('deliverables')
      .select('*')
      .eq('milestone_id', id)
      .order('created_at', { ascending: false }),
  ])

  const contract = contractResult.data
  if (!contract) {
    return apiError('Milestone not found.', 404)
  }

  if (
    contract.initiator_id !== ctx.userId &&
    contract.counterparty_id !== ctx.userId
  ) {
    return apiError('Milestone not found.', 404)
  }

  if (deliverablesResult.error) {
    return apiError(deliverablesResult.error.message, 500)
  }

  return apiSuccess({
    ...milestone,
    contract,
    deliverables: deliverablesResult.data ?? [],
  })
}, 'milestones:read')

const PatchSchema = z.object({
  action: z.enum(['approve', 'submit']),
  note: z.string().optional(),
})

const patchHandler = withApiAuth(async (req, ctx, params) => {
  const id = params?.id
  if (!id) {
    return apiError('Milestone ID required.', 400)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body.', 400)
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 422)
  }

  const supabaseAdmin = createAdminClient()
  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('id, title, state, contract_id')
    .eq('id', id)
    .maybeSingle()

  if (!milestone) {
    return apiError('Milestone not found.', 404)
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('id, initiator_id, counterparty_id, state')
    .eq('id', milestone.contract_id)
    .maybeSingle()

  if (!contract) {
    return apiError('Milestone not found.', 404)
  }

  if (parsed.data.action === 'approve') {
    if (contract.initiator_id !== ctx.userId) {
      return apiError('Only the service receiver can approve milestones.', 403)
    }

    if (milestone.state !== 'submitted') {
      return apiError(
        `Cannot approve milestone in '${milestone.state}' state.`,
        422
      )
    }

    const result = await releaseMilestonePayment(id, false)
    if (result.error) {
      return apiError(result.error, 500)
    }

    return apiSuccess({ milestone_id: id, action: 'approved' })
  }

  if (contract.counterparty_id !== ctx.userId) {
    return apiError('Only the service provider can submit milestone deliveries.', 403)
  }

  if (milestone.state !== 'in_progress') {
    return apiError(
      `Cannot submit milestone in '${milestone.state}' state.`,
      422
    )
  }

  await Promise.all([
    supabaseAdmin
      .from('milestones')
      .update({
        state: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id),
    supabaseAdmin.from('contracts').update({ state: 'in_review' }).eq('id', contract.id),
  ])

  if (parsed.data.note?.trim()) {
    await supabaseAdmin.from('deliverables').insert({
      milestone_id: id,
      submitted_by: ctx.userId,
      file_url: null,
      file_name: null,
      file_type: null,
      note: parsed.data.note.trim(),
    })
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: ctx.userId,
    event_type: 'milestone.submitted',
    payload: {
      milestone_id: id,
      source: 'api',
      has_note: Boolean(parsed.data.note?.trim()),
    },
  })

  await notifyContractEvent(contract.id, 'milestone.submitted', {
    milestone_id: id,
    source: 'api',
  }).catch(console.error)

  return apiSuccess({ milestone_id: id, action: 'submitted' })
}, 'milestones:write')

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return getHandler(req, params)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return patchHandler(req, params)
}
