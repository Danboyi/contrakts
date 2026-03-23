'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContractInviteEmail } from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
import {
  ROLE_LABELS,
  getCounterpartyRole,
  type PartyRole,
} from '@/lib/types/negotiation'
import {
  getAppUrl,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
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

const MilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  deadline: z.string().optional(),
})

const ContractSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  industry: z.string().min(1, 'Select an industry'),
  currency: z.string().min(1, 'Select a currency'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  terms: z.string().min(20, 'Terms must be at least 20 characters'),
  initiator_role: z.enum(['service_provider', 'service_receiver']),
  quoted_total_value: z.number().positive().optional(),
  counterparty_name: z.string().min(2, 'Enter the counterparty name'),
  counterparty_email: z.string().email('Enter a valid email'),
  invite_message: z.string().optional(),
  milestones: z.array(MilestoneSchema).min(1, 'Add at least one milestone'),
})

export type CreateContractInput = z.infer<typeof ContractSchema>

export type ContractActionResult = {
  error?: string
  contractId?: string
  inviteLink?: string
}

function getFirstIssueMessage(result: {
  success: false
  error: { issues: Array<{ message: string }> }
}) {
  return (
    result.error.issues[0]?.message ??
    'Please review the contract details and try again.'
  )
}

export async function createContract(
  input: CreateContractInput
): Promise<ContractActionResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return {
      error:
        'Contract creation is not configured yet. Add your Supabase credentials to continue.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in.' }
  }

  const parsed = ContractSchema.safeParse({
    ...input,
    title: sanitizeShortText(input.title),
    description: input.description ? sanitizeText(input.description) : undefined,
    terms: sanitizeText(input.terms),
    counterparty_email: input.counterparty_email
      ? sanitizeEmail(input.counterparty_email)
      : undefined,
    milestones: input.milestones.map((milestone) => ({
      ...milestone,
      title: sanitizeShortText(milestone.title),
      description: milestone.description
        ? sanitizeText(milestone.description)
        : undefined,
    })),
  })

  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed) }
  }

  const data = parsed.data
  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const totalValue = toSmallestUnit(
    data.milestones.reduce((sum, milestone) => sum + milestone.amount, 0)
  )
  if (
    typeof data.quoted_total_value === 'number' &&
    Math.abs(data.quoted_total_value - totalValue / 100) > 0.01
  ) {
    return {
      error: 'Milestone amounts must add up to the total contract value.',
    }
  }
  const platformFee = Math.round(totalValue * (PLATFORM_FEE_PCT / 100))
  const inviteToken = generateInviteToken()
  const refCode = generateContractRef()
  const counterpartyRole = getCounterpartyRole(data.initiator_role)

  let counterpartyId: string | null = null
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', data.counterparty_email)
    .maybeSingle()

  if (existingUser) {
    counterpartyId = existingUser.id
  }

  const isProvider = data.initiator_role === 'service_provider'
  const currentReviewerId = counterpartyId ?? null

  const { data: contract, error: contractError } = await supabaseAdmin
    .from('contracts')
    .insert({
      ref_code: refCode,
      title: data.title,
      description: data.description ?? null,
      initiator_id: user.id,
      counterparty_id: counterpartyId,
      invite_token: inviteToken,
      industry: data.industry,
      state: 'pending_review',
      initiator_role: data.initiator_role,
      service_provider_id: isProvider ? user.id : null,
      service_receiver_id: isProvider ? null : user.id,
      negotiation_status: 'pending_review',
      current_reviewer_id: currentReviewerId,
      review_round: 0,
      terms_locked: false,
      currency: data.currency,
      total_value: totalValue,
      platform_fee_pct: PLATFORM_FEE_PCT,
      platform_fee: platformFee,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      terms: data.terms,
    })
    .select('id')
    .single()

  if (contractError || !contract) {
    return { error: 'Failed to create contract. Please try again.' }
  }

  const milestoneInserts = data.milestones.map((milestone, index) => ({
    contract_id: contract.id,
    order_index: index,
    title: milestone.title,
    description: milestone.description ?? null,
    amount: toSmallestUnit(milestone.amount),
    deadline: milestone.deadline ?? null,
    state: 'pending' as const,
    is_locked: false,
    last_edited_by: user.id,
    last_edited_at: new Date().toISOString(),
  }))

  const { error: milestoneError } = await supabaseAdmin
    .from('milestones')
    .insert(milestoneInserts)

  if (milestoneError) {
    await supabaseAdmin.from('contracts').delete().eq('id', contract.id)
    return { error: 'Failed to create milestones. Please try again.' }
  }

  const { data: savedMilestones } = await supabaseAdmin
    .from('milestones')
    .select('id, title, description, amount, deadline, order_index')
    .eq('contract_id', contract.id)
    .order('order_index')

  const initialReview = await supabaseAdmin.from('contract_reviews').insert({
    contract_id: contract.id,
    reviewer_id: user.id,
    reviewer_role: data.initiator_role,
    round: 0,
    action: 'initial_draft',
    terms_snapshot: {
      title: data.title,
      description: data.description ?? null,
      industry: data.industry,
      total_value: totalValue,
      currency: data.currency,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      terms: data.terms,
      counterparty_name: data.counterparty_name,
      counterparty_email: data.counterparty_email,
    },
    milestones_snapshot:
      savedMilestones?.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description ?? '',
        amount: milestone.amount,
        due_date: milestone.deadline,
        order: milestone.order_index,
      })) ?? [],
    changes_summary: [],
    message: data.invite_message ?? null,
  })

  if (initialReview.error) {
    console.error('Failed to create initial review', initialReview.error)
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: user.id,
    event_type: 'contract.created',
    payload: {
      ref_code: refCode,
      title: data.title,
      initiator_role: data.initiator_role,
      counterparty_role: counterpartyRole,
    },
  })

  if (counterpartyId) {
    await insertNotifications({
      user_id: counterpartyId,
      contract_id: contract.id,
      type: 'contract_invite',
      title: 'New contract invite',
      body: `${profile?.full_name ?? 'A Contrakts user'} invited you to review "${data.title}" as the ${ROLE_LABELS[counterpartyRole].toLowerCase()}.`,
    })
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: user.id,
    event_type: 'contract.sent',
    payload: {
      invite_token: inviteToken,
      counterparty_email: data.counterparty_email ?? null,
    },
  })

  await supabaseAdmin.rpc('increment_user_contracts', { user_id: user.id })

  if (data.counterparty_email) {
    await sendContractInviteEmail({
      toEmail: data.counterparty_email,
      toName: data.counterparty_name,
      initiatorName:
        profile?.full_name ?? profile?.email ?? user.email ?? 'A Contrakts user',
      contractTitle: data.title,
      totalValue,
      currency: data.currency,
      inviteToken,
      initiatorRole: data.initiator_role,
      inviteMessage: data.invite_message ?? undefined,
    }).catch(console.error)
  }

  await notifyContractEvent(contract.id, 'contract.created').catch(console.error)

  revalidatePath('/contracts')
  revalidatePath('/dashboard')

  return {
    contractId: contract.id,
    inviteLink: `${getAppUrl()}/invite/${inviteToken}`,
  }
}

export async function signContract(
  contractId: string
): Promise<ContractActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Contract actions are not configured yet. Add your Supabase credentials to continue.',
    }
  }

  const supabase = await createClient()
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

  const isInitiator = contract.initiator_id === user.id
  const isCounterparty = contract.counterparty_id === user.id

  if (!isInitiator && !isCounterparty) {
    return { error: 'You are not a party to this contract.' }
  }

  const receiverId =
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)
  const providerId =
    contract.service_provider_id ??
    (contract.initiator_role === 'service_provider'
      ? contract.initiator_id
      : contract.counterparty_id)
  const isReceiver = receiverId === user.id
  const isProvider = providerId === user.id

  if (!['accepted', 'signing', 'signed', 'pending'].includes(contract.state)) {
    return { error: 'This contract is not awaiting signatures.' }
  }

  if (!isReceiver && !isProvider) {
    return { error: 'You are not assigned a signing role on this contract.' }
  }

  const now = new Date().toISOString()
  const updates: Record<string, string | boolean> = {}

  if (isReceiver) {
    if (contract.signed_by_receiver || contract.receiver_signed_at) {
      return { error: 'The service receiver has already signed this contract.' }
    }

    updates.signed_by_receiver = true
    updates.receiver_signed_at = now
  }

  if (isProvider) {
    if (!(contract.signed_by_receiver || contract.receiver_signed_at)) {
      return { error: 'The service receiver must sign before the service provider.' }
    }

    if (contract.signed_by_provider || contract.provider_signed_at) {
      return { error: 'The service provider has already signed this contract.' }
    }

    updates.signed_by_provider = true
    updates.provider_signed_at = now
  }

  if (isInitiator && !contract.signed_initiator_at) {
    updates.signed_initiator_at = now
  }

  if (isCounterparty && !contract.signed_counterparty_at) {
    updates.signed_counterparty_at = now
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'You have already signed this contract.' }
  }

  const receiverSignedAfterUpdate =
    Boolean(contract.signed_by_receiver || contract.receiver_signed_at) ||
    Boolean(updates.signed_by_receiver)
  const providerSignedAfterUpdate =
    Boolean(contract.signed_by_provider || contract.provider_signed_at) ||
    Boolean(updates.signed_by_provider)

  updates.state =
    receiverSignedAfterUpdate && providerSignedAfterUpdate ? 'signed' : 'signing'

  await supabase.from('contracts').update(updates).eq('id', contractId)

  await supabase.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'contract.signed',
    payload: {
      role: isReceiver
        ? 'service_receiver'
        : isProvider
          ? 'service_provider'
          : isInitiator
            ? 'initiator'
            : 'counterparty',
    },
  })

  await notifyContractEvent(contractId, 'contract.signed', {
    role: isReceiver
      ? 'service_receiver'
      : isProvider
        ? 'service_provider'
        : isInitiator
          ? 'initiator'
          : 'counterparty',
  }).catch(console.error)

  revalidatePath(`/contracts/${contractId}`)
  return { contractId }
}

export async function voidContract(
  contractId: string
): Promise<ContractActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Contract actions are not configured yet. Add your Supabase credentials to continue.',
    }
  }

  const supabase = await createClient()
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

  const isParty =
    contract.initiator_id === user.id || contract.counterparty_id === user.id

  if (!isParty) {
    return { error: 'You are not a party to this contract.' }
  }

  if (!['draft', 'pending'].includes(contract.state)) {
    return { error: 'Only draft or pending contracts can be voided.' }
  }

  await supabase
    .from('contracts')
    .update({ state: 'voided' })
    .eq('id', contractId)

  await supabase.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'contract.voided',
    payload: { voided_by: user.id },
  })

  await notifyContractEvent(contractId, 'contract.voided', {
    voided_by: user.id,
  }).catch(console.error)

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${contractId}`)
  return { contractId }
}
