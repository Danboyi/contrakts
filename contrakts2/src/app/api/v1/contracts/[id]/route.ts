import { NextRequest } from 'next/server'
import { apiError, apiSuccess, withApiAuth } from '@/lib/api/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

const getHandler = withApiAuth(async (_req, ctx, params) => {
  const id = params?.id
  if (!id) {
    return apiError('Contract ID required.', 400)
  }

  const supabaseAdmin = createAdminClient()
  const { data: contract, error } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', id)
    .or(`initiator_id.eq.${ctx.userId},counterparty_id.eq.${ctx.userId}`)
    .maybeSingle()

  if (error || !contract) {
    return apiError('Contract not found.', 404)
  }

  const [initiatorResult, counterpartyResult, milestonesResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, full_name, email, trust_score, kyc_status')
      .eq('id', contract.initiator_id)
      .maybeSingle(),
    contract.counterparty_id
      ? supabaseAdmin
          .from('users')
          .select('id, full_name, email, trust_score, kyc_status')
          .eq('id', contract.counterparty_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from('milestones')
      .select('*')
      .eq('contract_id', contract.id)
      .order('order_index', { ascending: true }),
  ])

  if (milestonesResult.error) {
    return apiError(milestonesResult.error.message, 500)
  }

  return apiSuccess({
    ...contract,
    initiator: initiatorResult.data,
    counterparty: counterpartyResult.data,
    milestones: milestonesResult.data ?? [],
  })
}, 'contracts:read')

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return getHandler(req, params)
}
