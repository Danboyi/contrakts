'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContractInviteEmail } from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
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
  initiator_role: z.enum(['vendor', 'service_receiver']).default('service_receiver'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  industry: z.string().min(1, 'Select an industry'),
  currency: z.string().min(1, 'Select a currency'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  terms: z.string().min(20, 'Terms must be at least 20 characters'),
  counterparty_email: z.string().email('Enter a valid email').optional(),
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
  const platformFee = Math.round(totalValue * (PLATFORM_FEE_PCT / 100))
  const inviteToken = generateInviteToken()
  const refCode = generateContractRef()

  let counterpartyId: string | null = null
  if (data.counterparty_email) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', data.counterparty_email)
      .maybeSingle()

    if (existingUser) {
      counterpartyId = existingUser.id
    }
  }

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      ref_code: refCode,
      title: data.title,
      description: data.description ?? null,
      initiator_id: user.id,
      counterparty_id: counterpartyId,
      invite_token: inviteToken,
      industry: data.industry,
      state: 'draft',
      initiator_role: data.initiator_role ?? 'service_receiver',
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
  }))

  const { error: milestoneError } = await supabase
    .from('milestones')
    .insert(milestoneInserts)

  if (milestoneError) {
    await supabase.from('contracts').delete().eq('id', contract.id)
    return { error: 'Failed to create milestones. Please try again.' }
  }

  await supabase.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: user.id,
    event_type: 'contract.created',
    payload: { ref_code: refCode, title: data.title },
  })

  await supabase.from('contracts').update({ state: 'negotiating' }).eq('id', contract.id)

  const isVendorInitiator = data.initiator_role === 'vendor'
  const initiatorRoleLabel = isVendorInitiator ? 'vendor' : 'client'

  if (counterpartyId) {
    await insertNotifications({
      user_id: counterpartyId,
      contract_id: contract.id,
      type: 'contract_invite',
      title: 'New contract proposal',
      body: `${profile?.full_name ?? `A ${initiatorRoleLabel}`} sent you a contract proposal for "${data.title}". Review the terms and milestones, then accept or negotiate.`,
    })
  }

  await supabase.from('audit_log').insert({
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
      toName: data.counterparty_email.split('@')[0] ?? 'there',
      initiatorName:
        profile?.full_name ?? profile?.email ?? user.email ?? 'A Contrakts user',
      contractTitle: data.title,
      totalValue,
      currency: data.currency,
      inviteToken,
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

  if (contract.state !== 'pending' && contract.state !== 'negotiating') {
    return { error: 'This contract is not awaiting signatures.' }
  }

  const isInitiator = contract.initiator_id === user.id
  const isCounterparty = contract.counterparty_id === user.id

  if (!isInitiator && !isCounterparty) {
    return { error: 'You are not a party to this contract.' }
  }

  const updates: Record<string, string> = {}

  if (isInitiator && !contract.signed_initiator_at) {
    updates.signed_initiator_at = new Date().toISOString()
  }

  if (isCounterparty && !contract.signed_counterparty_at) {
    updates.signed_counterparty_at = new Date().toISOString()
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'You have already signed this contract.' }
  }

  await supabase.from('contracts').update(updates).eq('id', contractId)

  await supabase.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'contract.signed',
    payload: { role: isInitiator ? 'initiator' : 'counterparty' },
  })

  await notifyContractEvent(contractId, 'contract.signed', {
    role: isInitiator ? 'initiator' : 'counterparty',
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

  if (!['draft', 'pending', 'negotiating'].includes(contract.state)) {
    return { error: 'Only draft, pending, or negotiating contracts can be voided.' }
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
