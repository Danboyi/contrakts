'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { insertNotifications } from '@/lib/notifications/store'
import { createClient } from '@/lib/supabase/server'
import { toSmallestUnit } from '@/lib/utils/format-currency'
import type { Contract, Milestone, PartyRole } from '@/types'

type EditableTerms = {
  title: string
  description: string
  terms: string
  total_value: number
  start_date: string
  end_date: string
}

type EditableMilestone = {
  id: string | null
  title: string
  description: string
  amount: number
  due_date: string | null
  order: number
}

type NegotiationActorContext = {
  userId: string
  contract: Contract
  userRole: PartyRole
  otherPartyId: string | null
}

function getCurrentUserRole(contract: Contract, userId: string): PartyRole | null {
  if (contract.service_receiver_id === userId) {
    return 'service_receiver'
  }

  if (contract.service_provider_id === userId) {
    return 'service_provider'
  }

  if (contract.initiator_id === userId) {
    return contract.initiator_role
  }

  if (contract.counterparty_id === userId) {
    return contract.initiator_role === 'service_provider'
      ? 'service_receiver'
      : 'service_provider'
  }

  return null
}

function getOtherPartyId(contract: Contract, userId: string): string | null {
  if (contract.service_receiver_id === userId) {
    return contract.service_provider_id
  }

  if (contract.service_provider_id === userId) {
    return contract.service_receiver_id
  }

  if (contract.initiator_id === userId) {
    return contract.counterparty_id
  }

  if (contract.counterparty_id === userId) {
    return contract.initiator_id
  }

  return null
}

function buildTermsSnapshot(
  source:
    | Contract
    | (EditableTerms & {
        currency?: string
      })
) {
  return {
    title: source.title,
    description: source.description ?? '',
    terms: 'terms' in source ? source.terms ?? '' : '',
    total_value: source.total_value,
    currency: 'currency' in source ? source.currency : undefined,
    start_date: source.start_date || null,
    end_date: source.end_date || null,
  }
}

function buildMilestoneSnapshot(milestones: Array<Milestone | EditableMilestone>) {
  return milestones.map((milestone, index) => ({
    id: milestone.id ?? undefined,
    title: milestone.title,
    description: milestone.description ?? '',
    amount:
      'state' in milestone ? milestone.amount : toSmallestUnit(milestone.amount),
    due_date:
      'deadline' in milestone ? milestone.deadline : (milestone.due_date ?? null),
    order:
      'order_index' in milestone
        ? milestone.order_index
        : (milestone.order ?? index),
  }))
}

function buildMilestoneEditRows(params: {
  reviewId: string
  currentMilestones: Milestone[]
  editedMilestones: EditableMilestone[]
}) {
  const rows: Array<{
    review_id: string
    milestone_id: string | null
    field_name: string
    old_value: string | null
    new_value: string | null
  }> = []

  const maxLength = Math.max(
    params.currentMilestones.length,
    params.editedMilestones.length
  )

  for (let index = 0; index < maxLength; index += 1) {
    const current = params.currentMilestones[index]
    const edited = params.editedMilestones[index]

    if (!current && edited) {
      rows.push({
        review_id: params.reviewId,
        milestone_id: null,
        field_name: 'added',
        old_value: null,
        new_value: edited.title,
      })
      continue
    }

    if (current && !edited) {
      rows.push({
        review_id: params.reviewId,
        milestone_id: current.id,
        field_name: 'removed',
        old_value: current.title,
        new_value: null,
      })
      continue
    }

    if (!current || !edited) {
      continue
    }

    const checks = [
      {
        field_name: 'title',
        old_value: current.title,
        new_value: edited.title,
      },
      {
        field_name: 'description',
        old_value: current.description ?? '',
        new_value: edited.description ?? '',
      },
      {
        field_name: 'amount',
        old_value: String(current.amount),
        new_value: String(toSmallestUnit(edited.amount)),
      },
      {
        field_name: 'due_date',
        old_value: current.deadline ?? '',
        new_value: edited.due_date ?? '',
      },
      {
        field_name: 'order',
        old_value: String(current.order_index),
        new_value: String(edited.order ?? index),
      },
    ]

    for (const check of checks) {
      if (check.old_value !== check.new_value) {
        rows.push({
          review_id: params.reviewId,
          milestone_id: current.id,
          field_name: check.field_name,
          old_value: check.old_value,
          new_value: check.new_value,
        })
      }
    }
  }

  return rows
}

async function getNegotiationActorContext(
  contractId: string
): Promise<NegotiationActorContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const supabaseAdmin = createAdminClient()
  const { data: contract, error } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    throw new Error('Contract not found.')
  }

  const typedContract = contract as Contract
  const userRole = getCurrentUserRole(typedContract, user.id)

  if (!userRole) {
    throw new Error('You are not a party to this contract.')
  }

  return {
    userId: user.id,
    contract: typedContract,
    userRole,
    otherPartyId: getOtherPartyId(typedContract, user.id),
  }
}

export async function submitReview(params: {
  contractId: string
  action: 'counter_offer' | 'review_edit'
  editedTerms: EditableTerms
  editedMilestones: EditableMilestone[]
  changesSummary: string[]
  message?: string
}) {
  const { userId, contract, userRole, otherPartyId } =
    await getNegotiationActorContext(params.contractId)
  const supabaseAdmin = createAdminClient()

  if (contract.current_reviewer_id !== userId) {
    throw new Error('It is not your turn to review.')
  }

  if (contract.terms_locked) {
    throw new Error('Terms are locked and can no longer be edited.')
  }

  if (!otherPartyId) {
    throw new Error('The other party must join before negotiation can continue.')
  }

  if (params.editedMilestones.length === 0) {
    throw new Error('Add at least one milestone before sending a counter-offer.')
  }

  const milestoneTotal = params.editedMilestones.reduce(
    (sum, milestone) =>
      sum + (Number.isFinite(milestone.amount) ? milestone.amount : 0),
    0
  )

  if (Math.abs(milestoneTotal - params.editedTerms.total_value) > 0.01) {
    throw new Error('Milestone amounts must add up to the total contract value.')
  }

  const { data: currentMilestones } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('contract_id', params.contractId)
    .order('order_index')

  const newRound = (contract.review_round ?? 0) + 1
  const now = new Date().toISOString()

  const { error: contractError } = await supabaseAdmin
    .from('contracts')
    .update({
      title: params.editedTerms.title,
      description: params.editedTerms.description || null,
      terms: params.editedTerms.terms || null,
      total_value: toSmallestUnit(params.editedTerms.total_value),
      start_date: params.editedTerms.start_date || null,
      end_date: params.editedTerms.end_date || null,
      state: 'countered',
      negotiation_status: 'countered',
      current_reviewer_id: otherPartyId,
      review_round: newRound,
      last_reviewed_at: now,
      updated_at: now,
    })
    .eq('id', params.contractId)

  if (contractError) {
    throw contractError
  }

  await supabaseAdmin.from('milestones').delete().eq('contract_id', params.contractId)

  const milestoneRows = params.editedMilestones.map((milestone, index) => ({
    contract_id: params.contractId,
    title: milestone.title,
    description: milestone.description || null,
    amount: toSmallestUnit(milestone.amount),
    deadline: milestone.due_date || null,
    order_index: milestone.order ?? index,
    state: 'pending' as const,
    is_locked: false,
    last_edited_by: userId,
    last_edited_at: now,
  }))

  const { error: milestoneError } = await supabaseAdmin
    .from('milestones')
    .insert(milestoneRows)

  if (milestoneError) {
    throw milestoneError
  }

  const { data: savedMilestones } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('contract_id', params.contractId)
    .order('order_index')

  const { data: reviewRow, error: reviewError } = await supabaseAdmin
    .from('contract_reviews')
    .insert({
      contract_id: params.contractId,
      reviewer_id: userId,
      reviewer_role: userRole,
      round: newRound,
      action: params.action,
      terms_snapshot: buildTermsSnapshot({
        ...params.editedTerms,
        total_value: toSmallestUnit(params.editedTerms.total_value),
        currency: contract.currency,
      }),
      milestones_snapshot: buildMilestoneSnapshot(
        (savedMilestones ?? []) as Milestone[]
      ),
      changes_summary: params.changesSummary,
      message: params.message || null,
    })
    .select('id')
    .single()

  if (reviewError || !reviewRow) {
    throw reviewError ?? new Error('Failed to save review history.')
  }

  const milestoneEdits = buildMilestoneEditRows({
    reviewId: reviewRow.id,
    currentMilestones: (currentMilestones ?? []) as Milestone[],
    editedMilestones: params.editedMilestones,
  })

  if (milestoneEdits.length > 0) {
    await supabaseAdmin.from('milestone_edits').insert(milestoneEdits)
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: params.contractId,
    actor_id: userId,
    event_type: 'contract.countered',
    payload: {
      round: newRound,
      reviewer_role: userRole,
      changes_summary: params.changesSummary,
    },
  })

  await insertNotifications({
    user_id: otherPartyId,
    contract_id: params.contractId,
    type: 'counter_offer',
    title: 'Counter-offer received',
    body: `${userRole === 'service_provider' ? 'The service provider' : 'The service receiver'} sent a counter-offer on "${params.editedTerms.title}".`,
  })

  await notifyContractEvent(params.contractId, 'contract.countered', {
    round: newRound,
    reviewer_role: userRole,
  }).catch(console.error)

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)
  revalidatePath(`/contracts/${params.contractId}/review`)

  return { success: true, round: newRound }
}

export async function acceptContract(params: {
  contractId: string
  message?: string
}) {
  const { userId, contract, userRole, otherPartyId } =
    await getNegotiationActorContext(params.contractId)
  const supabaseAdmin = createAdminClient()

  if (contract.current_reviewer_id !== userId) {
    throw new Error('It is not your turn to review.')
  }

  if (contract.terms_locked) {
    throw new Error('Contract already accepted.')
  }

  const now = new Date().toISOString()
  const round = (contract.review_round ?? 0) + 1

  const { error } = await supabaseAdmin
    .from('contracts')
    .update({
      state: 'accepted',
      negotiation_status: 'accepted',
      terms_locked: true,
      accepted_at: now,
      current_reviewer_id: null,
      last_reviewed_at: now,
      updated_at: now,
    })
    .eq('id', params.contractId)

  if (error) {
    throw error
  }

  await supabaseAdmin
    .from('milestones')
    .update({ is_locked: true })
    .eq('contract_id', params.contractId)

  const { data: milestones } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('contract_id', params.contractId)
    .order('order_index')

  await supabaseAdmin.from('contract_reviews').insert({
    contract_id: params.contractId,
    reviewer_id: userId,
    reviewer_role: userRole,
    round,
    action: 'accept',
    terms_snapshot: buildTermsSnapshot(contract),
    milestones_snapshot: buildMilestoneSnapshot(
      (milestones ?? []) as Milestone[]
    ),
    changes_summary: [],
    message: params.message || null,
  })

  await supabaseAdmin.from('audit_log').insert({
    contract_id: params.contractId,
    actor_id: userId,
    event_type: 'contract.accepted',
    payload: {
      reviewer_role: userRole,
      round,
    },
  })

  if (otherPartyId) {
    await insertNotifications({
      user_id: otherPartyId,
      contract_id: params.contractId,
      type: 'contract_accepted',
      title: 'Contract accepted',
      body: `${userRole === 'service_provider' ? 'The service provider' : 'The service receiver'} accepted the terms for "${contract.title}".`,
    })
  }

  await notifyContractEvent(params.contractId, 'contract.accepted', {
    reviewer_role: userRole,
    round,
  }).catch(console.error)

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)
  revalidatePath(`/contracts/${params.contractId}/review`)

  return { success: true }
}

export async function rejectContract(params: {
  contractId: string
  message: string
}) {
  const { userId, contract, userRole, otherPartyId } =
    await getNegotiationActorContext(params.contractId)
  const supabaseAdmin = createAdminClient()

  if (contract.current_reviewer_id !== userId) {
    throw new Error('It is not your turn to review.')
  }

  const now = new Date().toISOString()
  const round = (contract.review_round ?? 0) + 1

  const { error } = await supabaseAdmin
    .from('contracts')
    .update({
      state: 'cancelled',
      negotiation_status: 'rejected',
      current_reviewer_id: null,
      last_reviewed_at: now,
      updated_at: now,
    })
    .eq('id', params.contractId)

  if (error) {
    throw error
  }

  const { data: milestones } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('contract_id', params.contractId)
    .order('order_index')

  await supabaseAdmin.from('contract_reviews').insert({
    contract_id: params.contractId,
    reviewer_id: userId,
    reviewer_role: userRole,
    round,
    action: 'reject',
    terms_snapshot: buildTermsSnapshot(contract),
    milestones_snapshot: buildMilestoneSnapshot(
      (milestones ?? []) as Milestone[]
    ),
    changes_summary: ['Contract rejected'],
    message: params.message,
  })

  await supabaseAdmin.from('audit_log').insert({
    contract_id: params.contractId,
    actor_id: userId,
    event_type: 'contract.rejected',
    payload: {
      reviewer_role: userRole,
      round,
      message: params.message,
    },
  })

  if (otherPartyId) {
    await insertNotifications({
      user_id: otherPartyId,
      contract_id: params.contractId,
      type: 'contract_rejected',
      title: 'Contract rejected',
      body: `The contract "${contract.title}" was rejected. ${params.message}`,
    })
  }

  await notifyContractEvent(params.contractId, 'contract.rejected', {
    reviewer_role: userRole,
    round,
  }).catch(console.error)

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)
  revalidatePath(`/contracts/${params.contractId}/review`)

  return { success: true }
}
