'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { notifyContractEvent } from '@/lib/api/webhooks'
import {
  sendDisputeRaisedEmails,
  sendRulingIssuedEmails,
} from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
import { paystackInitialize, paystackTransfer } from '@/lib/paystack/client'
import { getAdminRole, hasAdminRole } from '@/lib/admin/auth'
import { syncTrustScore } from '@/lib/profile/trust'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import {
  refundDisputedMilestone,
  releaseMilestonePayment,
} from '@/lib/payments/actions'

export type DisputeActionResult = {
  error?: string
  success?: boolean
  disputeId?: string
  paymentUrl?: string
}

const DISPUTE_FEE_USD_CENTS = 1500

const RaiseDisputeSchema = z.object({
  contractId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  reason: z.enum([
    'scope_mismatch',
    'non_delivery',
    'quality',
    'payment_delay',
    'other',
  ]),
  description: z
    .string()
    .min(100, 'Description must be at least 100 characters'),
})

const RulingSchema = z
  .object({
    disputeId: z.string().uuid(),
    ruling: z.enum(['vendor_wins', 'client_wins', 'partial', 'cancelled']),
    rulingNotes: z.string().min(50, 'Ruling notes must be at least 50 characters'),
    rulingPctVendor: z.number().min(0).max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.ruling === 'partial' && value.rulingPctVendor === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rulingPctVendor'],
        message: 'A vendor split percentage is required for a partial ruling.',
      })
    }
  })

async function activateNextPendingMilestone(contractId: string) {
  const supabaseAdmin = createAdminClient()
  const { data: nextMilestones } = await supabaseAdmin
    .from('milestones')
    .select('id')
    .eq('contract_id', contractId)
    .eq('state', 'pending')
    .order('order_index', { ascending: true })
    .limit(1)

  if (nextMilestones?.[0]) {
    await supabaseAdmin
      .from('milestones')
      .update({ state: 'in_progress' })
      .eq('id', nextMilestones[0].id)
  }
}

async function queuePartialVendorPayment(params: {
  contractId: string
  milestoneId: string
  amount: number
  currency: string
  counterpartyId: string
  milestoneTitle: string
  initiatorId: string
}) {
  const supabaseAdmin = createAdminClient()
  const { data: vendorProfile } = await supabaseAdmin
    .from('users')
    .select('full_name, paystack_recipient_code, preferred_payout')
    .eq('id', params.counterpartyId)
    .single()

  const provider =
    vendorProfile?.preferred_payout === 'crypto' ? 'coinbase_commerce' : 'paystack'

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert({
      contract_id: params.contractId,
      milestone_id: params.milestoneId,
      payment_type: 'milestone_release',
      provider,
      provider_ref: null,
      provider_status: 'pending',
      gross_amount: params.amount,
      fee_amount: 0,
      net_amount: params.amount,
      currency: params.currency,
      recipient_id: params.counterpartyId,
      metadata: {
        review_required: provider !== 'paystack' || !vendorProfile?.paystack_recipient_code,
        dispute_split: true,
      },
    })
    .select()
    .single()

  if (error || !payment) {
    return { error: 'Could not queue the vendor split payout.' }
  }

  await supabaseAdmin
    .from('payments')
    .update({ provider_ref: payment.id })
    .eq('id', payment.id)

  if (provider === 'paystack' && vendorProfile?.paystack_recipient_code) {
    try {
      await paystackTransfer({
        source: 'balance',
        amount: params.amount,
        recipient: vendorProfile.paystack_recipient_code,
        reason: `Dispute ruling payment: ${params.milestoneTitle}`,
        reference: payment.id,
      })
    } catch (errorValue) {
      await supabaseAdmin.from('audit_log').insert({
        contract_id: params.contractId,
        actor_id: params.initiatorId,
        event_type: 'payment.transfer_error',
        payload: {
          milestone_id: params.milestoneId,
          reference: payment.id,
          error:
            errorValue instanceof Error ? errorValue.message : 'Unknown transfer error',
          dispute_split: true,
        },
      })

      await insertNotifications({
        user_id: params.initiatorId,
        contract_id: params.contractId,
        type: 'transfer_failed',
        title: 'Split payout failed - manual review needed',
        body: `The split payout for "${params.milestoneTitle}" could not be transferred automatically.`,
      })
    }
  } else {
    await insertNotifications([
      {
        user_id: params.initiatorId,
        contract_id: params.contractId,
        type: 'split_payout_review',
        title: 'Split payout queued for review',
        body: `The vendor portion of the dispute ruling for "${params.milestoneTitle}" is queued for manual review.`,
      },
      {
        user_id: params.counterpartyId,
        contract_id: params.contractId,
        type: 'split_payout_review',
        title: 'Vendor payout queued',
        body: `Your split payout for "${params.milestoneTitle}" is queued for manual review.`,
      },
    ])
  }

  return { success: true }
}

export async function raiseDispute(
  input: z.infer<typeof RaiseDisputeSchema>,
  evidencePaths: { path: string; name: string; description: string }[]
): Promise<DisputeActionResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const parsed = RaiseDisputeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid dispute input.' }
  }

  const { contractId, milestoneId, reason, description } = parsed.data

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

  const { data: milestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .eq('contract_id', contractId)
    .single()

  if (!milestone) {
    return { error: 'Milestone not found.' }
  }

  if (milestone.state !== 'submitted') {
    return { error: 'Disputes can only be raised on submitted milestones.' }
  }

  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('milestone_id', milestoneId)
    .in('status', ['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'])
    .maybeSingle()

  if (existing) {
    return { error: 'A dispute is already open for this milestone.' }
  }

  const respondentId =
    contract.initiator_id === user.id ? contract.counterparty_id : contract.initiator_id

  if (!respondentId) {
    return { error: 'The other party is not attached to this contract.' }
  }

  for (const file of evidencePaths) {
    if (!file.path.startsWith(`${contractId}/${milestoneId}/`)) {
      return { error: 'One or more evidence files are invalid for this contract.' }
    }
  }

  const { data: raiserProfile } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  if (!raiserProfile) {
    return { error: 'Your user profile could not be loaded.' }
  }

  const now = new Date()
  const responseDue = new Date(now.getTime() + 48 * 3600 * 1000)

  const { data: dispute, error: disputeError } = await supabase
    .from('disputes')
    .insert({
      contract_id: contractId,
      milestone_id: milestoneId,
      raised_by: user.id,
      respondent_id: respondentId,
      status: 'open',
      reason,
      description: description.trim(),
      raised_at: now.toISOString(),
      response_due_at: responseDue.toISOString(),
      dispute_fee_paid: false,
    })
    .select()
    .single()

  if (disputeError || !dispute) {
    return { error: 'Failed to open dispute. Please try again.' }
  }

  await supabase
    .from('milestones')
    .update({ state: 'disputed' })
    .eq('id', milestoneId)

  await supabase
    .from('contracts')
    .update({ state: 'disputed' })
    .eq('id', contractId)

  if (evidencePaths.length > 0) {
    await supabase.from('dispute_evidence').insert(
      evidencePaths.map((file) => ({
        dispute_id: dispute.id,
        submitted_by: user.id,
        file_url: file.path,
        file_name: file.name,
        description: file.description || null,
      }))
    )
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'dispute.raised',
    payload: {
      dispute_id: dispute.id,
      milestone_id: milestoneId,
      reason,
    },
  })

  await syncTrustScore(respondentId)

  await notifyContractEvent(contractId, 'dispute.raised', {
    dispute_id: dispute.id,
    milestone_id: milestoneId,
    reason,
  }).catch(console.error)

  await insertNotifications({
    user_id: respondentId,
    contract_id: contractId,
    type: 'dispute_raised',
    title: 'Dispute raised',
    body: `A dispute has been raised on milestone "${milestone.title}". You have 48 hours to respond.`,
  })

  await sendDisputeRaisedEmails(dispute.id).catch(console.error)

  const reference = nanoid(20)

  try {
    const init = await paystackInitialize({
      email: raiserProfile.email,
      amount: DISPUTE_FEE_USD_CENTS,
      currency: 'USD',
      reference,
      callback_url: `${getAppUrl()}/contracts/${contractId}/dispute?fee_paid=1`,
      metadata: {
        contract_id: contractId,
        dispute_id: dispute.id,
        payment_type: 'dispute_fee',
      },
    })

    await supabaseAdmin.from('audit_log').insert({
      contract_id: contractId,
      actor_id: user.id,
      event_type: 'dispute.fee_initiated',
      payload: {
        dispute_id: dispute.id,
        reference,
      },
    })

    revalidatePath(`/contracts/${contractId}`)
    revalidatePath(`/contracts/${contractId}/dispute`)
    return {
      success: true,
      disputeId: dispute.id,
      paymentUrl: init.authorization_url,
    }
  } catch {
    revalidatePath(`/contracts/${contractId}`)
    revalidatePath(`/contracts/${contractId}/dispute`)
    return { success: true, disputeId: dispute.id }
  }
}

export async function submitEvidence(
  disputeId: string,
  files: { path: string; name: string; description: string }[],
  statement?: string
): Promise<DisputeActionResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, contract_id, milestone_id, status, raised_by, respondent_id')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    return { error: 'Dispute not found.' }
  }

  const isParty = dispute.raised_by === user.id || dispute.respondent_id === user.id

  if (!isParty) {
    return { error: 'You are not a party to this dispute.' }
  }

  if (!['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'].includes(dispute.status)) {
    return { error: 'Evidence cannot be submitted at this stage.' }
  }

  for (const file of files) {
    if (!file.path.startsWith(`${dispute.contract_id}/${dispute.milestone_id}/`)) {
      return { error: 'One or more evidence files are invalid for this dispute.' }
    }
  }

  const inserts: Array<{
    dispute_id: string
    submitted_by: string
    file_url: string | null
    file_name: string | null
    description: string | null
  }> = []

  if (files.length > 0) {
    inserts.push(
      ...files.map((file) => ({
        dispute_id: disputeId,
        submitted_by: user.id,
        file_url: file.path,
        file_name: file.name,
        description: file.description || null,
      }))
    )
  }

  if (statement?.trim()) {
    inserts.push({
      dispute_id: disputeId,
      submitted_by: user.id,
      file_url: null,
      file_name: null,
      description: statement.trim(),
    })
  }

  if (inserts.length === 0) {
    return { error: 'Add at least one file or a written statement.' }
  }

  await supabase.from('dispute_evidence').insert(inserts)

  if (
    dispute.respondent_id === user.id &&
    ['open', 'awaiting_response'].includes(dispute.status)
  ) {
    await supabase
      .from('disputes')
      .update({ status: 'under_review' })
      .eq('id', disputeId)
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: dispute.contract_id,
    actor_id: user.id,
    event_type: 'dispute.evidence_submitted',
    payload: {
      dispute_id: disputeId,
      file_count: files.length,
      has_statement: Boolean(statement?.trim()),
    },
  })

  revalidatePath(`/contracts/${dispute.contract_id}/dispute`)
  revalidatePath(`/contracts/${dispute.contract_id}`)
  return { success: true }
}

export async function appealDispute(disputeId: string): Promise<DisputeActionResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, contract_id, milestone_id, status, raised_by, respondent_id')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    return { error: 'Dispute not found.' }
  }

  if (![dispute.raised_by, dispute.respondent_id].includes(user.id)) {
    return { error: 'Only a dispute party can request an appeal.' }
  }

  if (dispute.status !== 'resolved') {
    return { error: 'Only resolved disputes can be appealed.' }
  }

  const { data: existingAppeal } = await supabaseAdmin
    .from('audit_log')
    .select('id')
    .eq('contract_id', dispute.contract_id)
    .eq('event_type', 'dispute.appealed')
    .maybeSingle()

  if (existingAppeal) {
    return { error: 'Only one appeal is allowed per contract.' }
  }

  await supabaseAdmin
    .from('disputes')
    .update({
      status: 'appealed',
      resolved_at: null,
      arbitrator_id: null,
    })
    .eq('id', disputeId)

  await supabaseAdmin
    .from('milestones')
    .update({ state: 'disputed' })
    .eq('id', dispute.milestone_id)

  await supabaseAdmin
    .from('contracts')
    .update({ state: 'disputed' })
    .eq('id', dispute.contract_id)

  await supabaseAdmin.from('audit_log').insert({
    contract_id: dispute.contract_id,
    actor_id: user.id,
    event_type: 'dispute.appealed',
    payload: {
      dispute_id: disputeId,
    },
  })

  const otherPartyId =
    user.id === dispute.raised_by ? dispute.respondent_id : dispute.raised_by

  await insertNotifications([
    {
      user_id: otherPartyId,
      contract_id: dispute.contract_id,
      type: 'dispute_appealed',
      title: 'Dispute appealed',
      body: 'The dispute ruling has been appealed and is returning to arbitration.',
    },
    {
      user_id: user.id,
      contract_id: dispute.contract_id,
      type: 'dispute_appealed',
      title: 'Appeal requested',
      body: 'Your appeal has been logged and the dispute is back in arbitration.',
    },
  ])

  revalidatePath(`/contracts/${dispute.contract_id}/dispute`)
  revalidatePath(`/contracts/${dispute.contract_id}`)
  revalidatePath('/admin/disputes')
  return { success: true, disputeId }
}

export async function issueRuling(
  input: z.infer<typeof RulingSchema>
): Promise<DisputeActionResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const adminRole = await getAdminRole(user.id)
  if (!adminRole || !hasAdminRole(adminRole, 'arbitrator')) {
    return { error: 'Only arbitrators can issue rulings.' }
  }

  const parsed = RulingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid ruling input.' }
  }

  const { disputeId, ruling, rulingNotes, rulingPctVendor } = parsed.data

  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    return { error: 'Dispute not found.' }
  }

  if (!['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'].includes(dispute.status)) {
    return { error: 'This dispute is not awaiting a ruling.' }
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', dispute.contract_id)
    .single()

  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('id', dispute.milestone_id)
    .single()

  if (!contract || !milestone) {
    return { error: 'The dispute record is incomplete.' }
  }

  const counterpartyId = contract.counterparty_id
  if (!counterpartyId) {
    return { error: 'The contract counterparty is missing.' }
  }

  const now = new Date().toISOString()

  if (ruling === 'vendor_wins') {
    await supabaseAdmin
      .from('milestones')
      .update({
        state: 'submitted',
        approved_at: null,
        paid_at: null,
      })
      .eq('id', milestone.id)

    const releaseResult = await releaseMilestonePayment(milestone.id, false, true)
    if (releaseResult.error) {
      return { error: releaseResult.error }
    }
  } else if (ruling === 'client_wins') {
    const refundResult = await refundDisputedMilestone(milestone.id, true)
    if (refundResult.error) {
      return { error: refundResult.error }
    }

    await supabaseAdmin
      .from('milestones')
      .update({
        state: 'in_progress',
        submitted_at: null,
        approved_at: null,
        paid_at: null,
        auto_released: false,
      })
      .eq('id', milestone.id)

    await supabaseAdmin
      .from('contracts')
      .update({ state: 'active' })
      .eq('id', contract.id)
  } else if (ruling === 'partial') {
    const vendorAmount = Math.round(milestone.amount * ((rulingPctVendor ?? 0) / 100))
    const clientAmount = milestone.amount - vendorAmount

    if (vendorAmount > 0) {
      const vendorResult = await queuePartialVendorPayment({
        contractId: contract.id,
        milestoneId: milestone.id,
        amount: vendorAmount,
        currency: contract.currency,
        counterpartyId,
        milestoneTitle: milestone.title,
        initiatorId: contract.initiator_id,
      })

      if (vendorResult.error) {
        return { error: vendorResult.error }
      }
    }

    if (clientAmount > 0) {
      await supabaseAdmin.from('payments').insert({
        contract_id: contract.id,
        milestone_id: milestone.id,
        payment_type: 'refund',
        provider: contract.payment_method === 'crypto' ? 'coinbase_commerce' : 'paystack',
        provider_ref: `partial_client_${disputeId}`,
        provider_status: 'pending',
        gross_amount: clientAmount,
        fee_amount: 0,
        net_amount: clientAmount,
        currency: contract.currency,
        recipient_id: contract.initiator_id,
        metadata: {
          review_required: true,
          dispute_split: true,
        },
      })

      await insertNotifications({
        user_id: contract.initiator_id,
        contract_id: contract.id,
        type: 'refund_review',
        title: 'Client refund queued',
        body: `The client portion of the dispute ruling for "${milestone.title}" is queued for manual handling.`,
      })
    }

    await supabaseAdmin
      .from('milestones')
      .update({
        state: 'paid',
        approved_at: now,
        paid_at: now,
        auto_released: false,
      })
      .eq('id', milestone.id)

    await activateNextPendingMilestone(contract.id)

    await supabaseAdmin
      .from('contracts')
      .update({ state: 'active' })
      .eq('id', contract.id)
  } else {
    await supabaseAdmin
      .from('milestones')
      .update({ state: 'submitted' })
      .eq('id', milestone.id)

    await supabaseAdmin
      .from('contracts')
      .update({ state: 'in_review' })
      .eq('id', contract.id)
  }

  await supabaseAdmin
    .from('disputes')
    .update({
      status: 'resolved',
      ruling,
      ruling_notes: rulingNotes.trim(),
      ruling_pct_vendor: rulingPctVendor ?? null,
      arbitrator_id: user.id,
      resolved_at: now,
    })
    .eq('id', disputeId)

  await Promise.all([
    syncTrustScore(contract.initiator_id),
    syncTrustScore(counterpartyId),
  ])

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: user.id,
    event_type: 'dispute.resolved',
    payload: {
      dispute_id: disputeId,
      ruling,
      ruling_pct_vendor: rulingPctVendor ?? null,
    },
  })

  const rulingLabel = {
    vendor_wins: 'Ruling: vendor wins - payment release initiated.',
    client_wins: 'Ruling: client wins - milestone reset for re-delivery.',
    partial: `Ruling: partial - ${rulingPctVendor}% allocated to the vendor.`,
    cancelled: 'The dispute was cancelled and returned to client review.',
  }[ruling]

  await insertNotifications([
    {
      user_id: contract.initiator_id,
      contract_id: contract.id,
      type: 'dispute_resolved',
      title: 'Dispute resolved',
      body: rulingLabel,
    },
    {
      user_id: counterpartyId,
      contract_id: contract.id,
      type: 'dispute_resolved',
      title: 'Dispute resolved',
      body: rulingLabel,
    },
  ])

  await sendRulingIssuedEmails(disputeId).catch(console.error)

  await notifyContractEvent(contract.id, 'dispute.resolved', {
    dispute_id: disputeId,
    ruling,
  }).catch(console.error)

  revalidatePath(`/contracts/${contract.id}/dispute`)
  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath(`/contracts/${contract.id}/milestones`)
  revalidatePath(`/contracts/${contract.id}/payments`)
  revalidatePath('/admin/disputes')

  return { success: true, disputeId }
}
