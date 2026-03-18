import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess, withApiAuth } from '@/lib/api/middleware'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/supabase/config'
import { PLATFORM_FEE_PCT } from '@/lib/utils/constants'
import { toSmallestUnit } from '@/lib/utils/format-currency'
import {
  generateContractRef,
  generateInviteToken,
} from '@/lib/utils/generate-ref'
import {
  sanitizeEmail,
  sanitizeShortText,
  sanitizeText,
} from '@/lib/utils/sanitize'

function parseNonNegativeInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed
}

const getHandler = withApiAuth(async (req, ctx) => {
  const supabaseAdmin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state')
  const limit = Math.min(parseNonNegativeInt(searchParams.get('limit'), 20), 100)
  const offset = parseNonNegativeInt(searchParams.get('offset'), 0)

  let query = supabaseAdmin
    .from('contracts')
    .select(
      `
        id,
        ref_code,
        title,
        state,
        currency,
        total_value,
        platform_fee,
        created_at,
        funded_at,
        completed_at
      `,
      { count: 'exact' }
    )
    .or(`initiator_id.eq.${ctx.userId},counterparty_id.eq.${ctx.userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (state) {
    query = query.eq('state', state)
  }

  const { data: contracts, error, count } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  const contractIds = (contracts ?? []).map((contract) => contract.id)
  let milestonesByContract: Record<string, unknown[]> = {}

  if (contractIds.length > 0) {
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('milestones')
      .select('id, contract_id, title, state, amount, order_index')
      .in('contract_id', contractIds)
      .order('order_index', { ascending: true })

    if (milestonesError) {
      return apiError(milestonesError.message, 500)
    }

    milestonesByContract = (milestones ?? []).reduce<Record<string, unknown[]>>(
      (accumulator, milestone) => {
        accumulator[milestone.contract_id] = [
          ...(accumulator[milestone.contract_id] ?? []),
          {
            id: milestone.id,
            title: milestone.title,
            state: milestone.state,
            amount: milestone.amount,
            order_index: milestone.order_index,
          },
        ]
        return accumulator
      },
      {}
    )
  }

  return apiSuccess({
    contracts: (contracts ?? []).map((contract) => ({
      ...contract,
      milestones: milestonesByContract[contract.id] ?? [],
    })),
    total: count ?? 0,
    limit,
    offset,
  })
}, 'contracts:read')

const CreateContractSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  industry: z.string(),
  currency: z.string().default('USD'),
  counterparty_email: z.string().email(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  terms: z.string().min(20),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().positive(),
        deadline: z.string().optional(),
      })
    )
    .min(1),
})

const postHandler = withApiAuth(async (req, ctx) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body.', 400)
  }

  const raw = body as Record<string, unknown>
  const parsed = CreateContractSchema.safeParse({
    ...raw,
    title:
      typeof raw.title === 'string' ? sanitizeShortText(raw.title) : raw.title,
    description:
      typeof raw.description === 'string'
        ? sanitizeText(raw.description)
        : raw.description,
    terms:
      typeof raw.terms === 'string' ? sanitizeText(raw.terms) : raw.terms,
    counterparty_email:
      typeof raw.counterparty_email === 'string'
        ? sanitizeEmail(raw.counterparty_email)
        : raw.counterparty_email,
    milestones: Array.isArray(raw.milestones)
      ? raw.milestones.map((milestone) =>
          typeof milestone === 'object' && milestone !== null
            ? {
                ...milestone,
                title:
                  typeof (milestone as { title?: unknown }).title === 'string'
                    ? sanitizeShortText((milestone as { title: string }).title)
                    : (milestone as { title?: unknown }).title,
                description:
                  typeof (milestone as { description?: unknown }).description ===
                  'string'
                    ? sanitizeText(
                        (milestone as { description: string }).description
                      )
                    : (milestone as { description?: unknown }).description,
              }
            : milestone
        )
      : raw.milestones,
  })
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 422, {
      validation_errors: parsed.error.issues,
    })
  }

  const data = parsed.data
  const totalValue = toSmallestUnit(
    data.milestones.reduce((sum, milestone) => sum + milestone.amount, 0)
  )
  const platformFee = Math.round(totalValue * (PLATFORM_FEE_PCT / 100))
  const inviteToken = generateInviteToken()
  const refCode = generateContractRef()
  const supabaseAdmin = createAdminClient()

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', data.counterparty_email)
    .maybeSingle()

  const { data: contract, error: contractError } = await supabaseAdmin
    .from('contracts')
    .insert({
      ref_code: refCode,
      title: data.title,
      description: data.description ?? null,
      initiator_id: ctx.userId,
      counterparty_id: existingUser?.id ?? null,
      invite_token: inviteToken,
      industry: data.industry,
      state: 'pending',
      currency: data.currency,
      total_value: totalValue,
      platform_fee_pct: PLATFORM_FEE_PCT,
      platform_fee: platformFee,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      terms: data.terms,
      signed_initiator_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (contractError || !contract) {
    return apiError('Failed to create contract.', 500)
  }

  const { error: milestoneError } = await supabaseAdmin
    .from('milestones')
    .insert(
      data.milestones.map((milestone, index) => ({
        contract_id: contract.id,
        order_index: index,
        title: milestone.title,
        description: milestone.description ?? null,
        amount: toSmallestUnit(milestone.amount),
        deadline: milestone.deadline ?? null,
        state: 'pending',
      }))
    )

  if (milestoneError) {
    await supabaseAdmin.from('contracts').delete().eq('id', contract.id)
    return apiError('Failed to create milestones.', 500)
  }

  await Promise.all([
    supabaseAdmin.from('audit_log').insert({
      contract_id: contract.id,
      actor_id: ctx.userId,
      event_type: 'contract.created',
      payload: {
        source: 'api',
        ref_code: refCode,
      },
    }),
    supabaseAdmin.rpc('increment_user_contracts', { user_id: ctx.userId }),
  ])

  await notifyContractEvent(contract.id, 'contract.created', {
    source: 'api',
  }).catch(console.error)

  return apiSuccess(
    {
      contract,
      invite_url: `${getAppUrl()}/invite/${inviteToken}`,
    },
    201
  )
}, 'contracts:write')

export async function GET(req: NextRequest) {
  return getHandler(req)
}

export async function POST(req: NextRequest) {
  return postHandler(req)
}
