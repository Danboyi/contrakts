'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import { insertNotifications } from '@/lib/notifications/store'
import { isSupabaseConfigured, isSupabaseAdminConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { toSmallestUnit } from '@/lib/utils/format-currency'
import { sanitizeText, sanitizeShortText } from '@/lib/utils/sanitize'
import { PLATFORM_FEE_PCT } from '@/lib/utils/constants'

type ActionResult = {
  error?: string
  success?: boolean
}

const ReviewChangesSchema = z.object({
  contractId: z.string().uuid(),
  changes_summary: z.string().min(1, 'Please describe your changes'),
  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().positive(),
        deadline: z.string().optional(),
      })
    )
    .min(1),
  terms: z.string().min(20).optional(),
})

/**
 * Submit a review (counter-offer) on a contract in negotiation.
 * Either party can propose changes to milestones and terms.
 */
export async function submitContractReview(
  input: z.infer<typeof ReviewChangesSchema>
): Promise<ActionResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return { error: 'Service not configured.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const parsed = ReviewChangesSchema.safeParse({
    ...input,
    changes_summary: sanitizeText(input.changes_summary),
    milestones: input.milestones.map((m) => ({
      ...m,
      title: sanitizeShortText(m.title),
      description: m.description ? sanitizeText(m.description) : undefined,
    })),
    terms: input.terms ? sanitizeText(input.terms) : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const data = parsed.data
  const supabaseAdmin = createAdminClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, initiator:users!initiator_id(full_name), counterparty:users!counterparty_id(full_name)')
    .eq('id', data.contractId)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  if (contract.state !== 'negotiating') {
    return { error: 'This contract is not in negotiation.' }
  }

  const isInitiator = contract.initiator_id === user.id
  const isCounterparty = contract.counterparty_id === user.id

  if (!isInitiator && !isCounterparty) {
    return { error: 'You are not a party to this contract.' }
  }

  // Get current round number
  const { count } = await supabase
    .from('contract_negotiations')
    .select('*', { count: 'exact', head: true })
    .eq('contract_id', data.contractId)

  const roundNumber = (count ?? 0) + 1

  // Insert negotiation round
  await supabaseAdmin.from('contract_negotiations').insert({
    contract_id: data.contractId,
    round_number: roundNumber,
    submitted_by: user.id,
    status: 'pending_review',
    changes_summary: data.changes_summary,
    milestone_changes: data.milestones as unknown as import('@/types/supabase').Json,
    terms_changes: data.terms ?? null,
  })

  // Update milestones on the contract
  // Delete existing milestones and re-insert with new values
  await supabaseAdmin
    .from('milestones')
    .delete()
    .eq('contract_id', data.contractId)

  const milestoneInserts = data.milestones.map((milestone, index) => ({
    contract_id: data.contractId,
    order_index: index,
    title: milestone.title,
    description: milestone.description ?? null,
    amount: toSmallestUnit(milestone.amount),
    deadline: milestone.deadline ?? null,
    state: 'pending' as const,
  }))

  await supabaseAdmin.from('milestones').insert(milestoneInserts)

  // Update contract total value and terms if changed
  const newTotalValue = milestoneInserts.reduce((sum, m) => sum + m.amount, 0)
  const updateData: Record<string, unknown> = {
    total_value: newTotalValue,
    platform_fee: Math.round(newTotalValue * (PLATFORM_FEE_PCT / 100)),
  }

  if (data.terms) {
    updateData.terms = data.terms
  }

  await supabase.from('contracts').update(updateData).eq('id', data.contractId)

  // Log activity
  await supabase.from('audit_log').insert({
    contract_id: data.contractId,
    actor_id: user.id,
    event_type: 'contract.review_submitted',
    payload: {
      round_number: roundNumber,
      changes_summary: data.changes_summary,
    },
  })

  // Notify the other party
  const otherPartyId = isInitiator ? contract.counterparty_id : contract.initiator_id
  const profile = isInitiator
    ? (contract.initiator as unknown as { full_name: string } | null)
    : (contract.counterparty as unknown as { full_name: string } | null)

  if (otherPartyId) {
    await insertNotifications({
      user_id: otherPartyId,
      contract_id: data.contractId,
      type: 'contract_review',
      title: 'Contract review submitted',
      body: `${profile?.full_name ?? 'The other party'} submitted changes to "${contract.title}". Review their proposed terms and milestones.`,
    })
  }

  await notifyContractEvent(data.contractId, 'contract.review_submitted').catch(
    console.error
  )

  revalidatePath(`/contracts/${data.contractId}`)
  revalidatePath('/contracts')
  return { success: true }
}

/**
 * Accept the current contract terms — no more changes needed.
 * This moves the contract from negotiating → pending (awaiting signatures).
 */
export async function acceptContractTerms(
  contractId: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return { error: 'Service not configured.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const supabaseAdmin = createAdminClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, initiator:users!initiator_id(full_name), counterparty:users!counterparty_id(full_name)')
    .eq('id', contractId)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  if (contract.state !== 'negotiating') {
    return { error: 'This contract is not in negotiation.' }
  }

  const isInitiator = contract.initiator_id === user.id
  const isCounterparty = contract.counterparty_id === user.id

  if (!isInitiator && !isCounterparty) {
    return { error: 'You are not a party to this contract.' }
  }

  // Mark any pending negotiation rounds as accepted
  await supabaseAdmin
    .from('contract_negotiations')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('contract_id', contractId)
    .eq('status', 'pending_review')

  // Move contract to pending (awaiting signatures)
  await supabase
    .from('contracts')
    .update({ state: 'pending' })
    .eq('id', contractId)

  await supabase.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'contract.terms_accepted',
    payload: { accepted_by: isInitiator ? 'initiator' : 'counterparty' },
  })

  const otherPartyId = isInitiator ? contract.counterparty_id : contract.initiator_id
  const profile = isInitiator
    ? (contract.initiator as unknown as { full_name: string } | null)
    : (contract.counterparty as unknown as { full_name: string } | null)

  if (otherPartyId) {
    const isServiceReceiver =
      (contract.initiator_role === 'service_receiver' && isInitiator) ||
      (contract.initiator_role === 'vendor' && isCounterparty)

    await insertNotifications({
      user_id: otherPartyId,
      contract_id: contractId,
      type: 'contract_accepted',
      title: 'Contract terms accepted',
      body: `${profile?.full_name ?? 'The other party'} accepted the terms for "${contract.title}".${isServiceReceiver ? ' Proceed to sign and fund the project.' : ' Waiting for the client to sign and fund.'}`,
    })
  }

  await notifyContractEvent(contractId, 'contract.terms_accepted').catch(
    console.error
  )

  revalidatePath(`/contracts/${contractId}`)
  revalidatePath('/contracts')
  return { success: true }
}
