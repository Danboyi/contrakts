'use server'

import { revalidatePath } from 'next/cache'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { sendSystemMessage } from '@/lib/messages'
import { sendMilestoneSubmittedEmail } from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
import { releaseMilestonePayment } from '@/lib/payments/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackItem, ReviewVerdict, SubmissionType } from '@/types'
import type { Json } from '@/types/supabase'

type ContractRecord = {
  id: string
  title: string
  state: string
  initiator_id: string
  counterparty_id: string | null
  initiator_role: string
  service_provider_id: string | null
  service_receiver_id: string | null
}

type MilestoneRecord = {
  id: string
  contract_id: string
  title: string
  state: string
  amount: number
}

function getServiceProviderId(contract: ContractRecord) {
  return (
    contract.service_provider_id ??
    (contract.initiator_role === 'service_provider'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

function getServiceReceiverId(contract: ContractRecord) {
  return (
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

function validateSubmissionPayload(params: {
  submissionType: SubmissionType
  externalUrl?: string
  deliverables: Array<{ fileUrl: string }>
}) {
  const hasFiles = params.deliverables.length > 0
  const hasLink = Boolean(params.externalUrl?.trim())

  if (params.externalUrl?.trim()) {
    try {
      new URL(params.externalUrl)
    } catch {
      throw new Error('Enter a valid external URL.')
    }
  }

  if (params.submissionType === 'files' && !hasFiles) {
    throw new Error('Upload at least one file for this submission.')
  }

  if (
    (params.submissionType === 'link' || params.submissionType === 'code') &&
    !hasLink
  ) {
    throw new Error('Add a valid URL for this submission.')
  }

  if (params.submissionType === 'mixed' && !hasFiles && !hasLink) {
    throw new Error('Add at least one file or URL before submitting.')
  }
}

export async function createSubmission(params: {
  contractId: string
  milestoneId: string
  note?: string
  submissionType: SubmissionType
  externalUrl?: string
  deliverables: Array<{
    fileUrl: string
    fileName: string
    fileType: string
    note?: string
    sortOrder: number
  }>
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  validateSubmissionPayload(params)

  const { data: contractData, error: contractError } = await supabase
    .from('contracts')
    .select(
      'id, title, state, initiator_id, counterparty_id, initiator_role, service_provider_id, service_receiver_id'
    )
    .eq('id', params.contractId)
    .single()

  if (contractError || !contractData) {
    throw new Error('Contract not found')
  }

  const contract = contractData as ContractRecord
  const serviceProviderId = getServiceProviderId(contract)
  const serviceReceiverId = getServiceReceiverId(contract)

  if (serviceProviderId !== user.id) {
    throw new Error('Only the service provider can submit deliverables')
  }

  if (contract.state !== 'active') {
    throw new Error('Contract must be active to submit deliverables')
  }

  const { data: milestoneData, error: milestoneError } = await supabase
    .from('milestones')
    .select('id, contract_id, title, state, amount')
    .eq('id', params.milestoneId)
    .eq('contract_id', params.contractId)
    .single()

  if (milestoneError || !milestoneData) {
    throw new Error('Milestone not found')
  }

  const milestone = milestoneData as MilestoneRecord

  if (milestone.state !== 'in_progress') {
    throw new Error('This milestone is not ready for a new submission')
  }

  for (const deliverable of params.deliverables) {
    if (
      !deliverable.fileUrl.startsWith(`${params.contractId}/${params.milestoneId}/`)
    ) {
      throw new Error('One or more uploaded files are invalid for this milestone.')
    }
  }

  const { data: latestSubmission } = await supabase
    .from('submissions')
    .select('id, version, state')
    .eq('milestone_id', params.milestoneId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (
    latestSubmission &&
    !['revision_requested', 'rejected'].includes(latestSubmission.state)
  ) {
    throw new Error('This milestone already has a submission under review.')
  }

  const version = (latestSubmission?.version ?? 0) + 1

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      contract_id: params.contractId,
      milestone_id: params.milestoneId,
      submitted_by: user.id,
      version,
      state: 'pending_review',
      note: params.note?.trim() || null,
      submission_type: params.submissionType,
      external_url: params.externalUrl?.trim() || null,
    })
    .select()
    .single()

  if (submissionError || !submission) {
    throw new Error(submissionError?.message ?? 'Failed to create submission.')
  }

  if (params.deliverables.length > 0) {
    const { error: deliverableError } = await supabase.from('deliverables').insert(
      params.deliverables.map((deliverable) => ({
        milestone_id: params.milestoneId,
        submitted_by: user.id,
        file_url: deliverable.fileUrl,
        file_name: deliverable.fileName,
        file_type: deliverable.fileType,
        note: deliverable.note ?? null,
        submission_id: submission.id,
        sort_order: deliverable.sortOrder,
      }))
    )

    if (deliverableError) {
      await admin.from('submissions').delete().eq('id', submission.id)
      throw new Error('Failed to save deliverables.')
    }
  }

  const now = new Date().toISOString()
  const [milestoneUpdate, contractUpdate] = await Promise.all([
    supabase
      .from('milestones')
      .update({
        state: 'submitted',
        submitted_at: now,
        approved_at: null,
        auto_released: false,
      })
      .eq('id', params.milestoneId)
      .eq('state', 'in_progress'),
    supabase
      .from('contracts')
      .update({ state: 'in_review' })
      .eq('id', params.contractId),
  ])

  if (milestoneUpdate.error || contractUpdate.error) {
    await admin.from('deliverables').delete().eq('submission_id', submission.id)
    await admin.from('submissions').delete().eq('id', submission.id)
    await admin
      .from('milestones')
      .update({
        state: 'in_progress',
        submitted_at: null,
        approved_at: null,
        auto_released: false,
      })
      .eq('id', params.milestoneId)

    throw new Error(
      milestoneUpdate.error?.message ??
        contractUpdate.error?.message ??
        'Failed to update milestone state.'
    )
  }

  await admin.from('audit_log').insert({
    contract_id: params.contractId,
    actor_id: user.id,
    event_type: 'milestone.submitted',
    payload: {
      milestone_id: params.milestoneId,
      submission_id: submission.id,
      version,
      submission_type: params.submissionType,
      file_count: params.deliverables.length,
      external_url: params.externalUrl?.trim() || null,
      has_note: Boolean(params.note?.trim()),
    },
  })

  if (serviceReceiverId) {
    await insertNotifications({
      user_id: serviceReceiverId,
      contract_id: params.contractId,
      type: 'submission_received',
      title: 'Submission received',
      body: `v${version} of "${milestone.title}" has been submitted for review.`,
      read: false,
    })
  }

  await sendSystemMessage({
    contractId: params.contractId,
    body: `Submission v${version} for "${milestone.title}" was submitted for review.`,
    milestoneId: params.milestoneId,
    messageType: 'submission',
    actorId: user.id,
  }).catch(console.error)

  await sendMilestoneSubmittedEmail({
    contractId: params.contractId,
    milestoneId: params.milestoneId,
  }).catch(console.error)

  await notifyContractEvent(params.contractId, 'milestone.submitted', {
    milestone_id: params.milestoneId,
    submission_id: submission.id,
    version,
  }).catch(console.error)

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)
  revalidatePath(`/contracts/${params.contractId}/milestones`)

  return { submission, version, success: true }
}

export async function reviewSubmission(params: {
  submissionId: string
  verdict: ReviewVerdict
  feedback?: string
  feedbackItems?: FeedbackItem[]
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  if (
    params.verdict !== 'approved' &&
    !params.feedback?.trim() &&
    !(params.feedbackItems?.length ?? 0)
  ) {
    throw new Error('Add feedback when requesting revisions or rejecting a submission.')
  }

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, contract_id, milestone_id, version, state, submitted_by')
    .eq('id', params.submissionId)
    .single()

  if (!submission) {
    throw new Error('Submission not found')
  }

  if (!['pending_review', 'in_review'].includes(submission.state)) {
    throw new Error('This submission has already been reviewed')
  }

  const { data: latestSubmission } = await supabase
    .from('submissions')
    .select('id')
    .eq('milestone_id', submission.milestone_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestSubmission?.id !== submission.id) {
    throw new Error('Only the latest submission can be reviewed.')
  }

  const { data: contractData } = await supabase
    .from('contracts')
    .select(
      'id, title, state, initiator_id, counterparty_id, initiator_role, service_provider_id, service_receiver_id'
    )
    .eq('id', submission.contract_id)
    .single()

  if (!contractData) {
    throw new Error('Contract not found')
  }

  const contract = contractData as ContractRecord
  const serviceProviderId = getServiceProviderId(contract)
  const serviceReceiverId = getServiceReceiverId(contract)

  if (serviceReceiverId !== user.id) {
    throw new Error('Only the service receiver can review submissions')
  }

  const { data: milestoneData } = await supabase
    .from('milestones')
    .select('id, contract_id, title, state, amount')
    .eq('id', submission.milestone_id)
    .single()

  if (!milestoneData) {
    throw new Error('Milestone not found')
  }

  const milestone = milestoneData as MilestoneRecord
  const normalizedState =
    params.verdict === 'approved'
      ? 'approved'
      : params.verdict === 'revision_requested'
        ? 'revision_requested'
        : 'rejected'
  const feedbackText = params.feedback?.trim() || null

  const { error: reviewError } = await supabase.from('submission_reviews').insert({
    submission_id: params.submissionId,
    reviewer_id: user.id,
    verdict: params.verdict,
    feedback: feedbackText,
    feedback_items: ((params.feedbackItems ?? []) as unknown) as Json,
  })

  if (reviewError) {
    throw new Error(reviewError.message)
  }

  const { error: submissionUpdateError } = await supabase
    .from('submissions')
    .update({
      state: normalizedState,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.submissionId)

  if (submissionUpdateError) {
    throw new Error(submissionUpdateError.message)
  }

  let warning: string | undefined

  if (params.verdict === 'approved') {
    const releaseResult = await releaseMilestonePayment(submission.milestone_id, false)
    if (releaseResult.error) {
      warning = releaseResult.error
    }
  } else {
    const [milestoneReset, contractReset] = await Promise.all([
      supabase
        .from('milestones')
        .update({
          state: 'in_progress',
          submitted_at: null,
          approved_at: null,
          auto_released: false,
        })
        .eq('id', submission.milestone_id),
      supabase
        .from('contracts')
        .update({ state: 'active' })
        .eq('id', submission.contract_id)
        .eq('state', 'in_review'),
    ])

    if (milestoneReset.error || contractReset.error) {
      throw new Error(
        milestoneReset.error?.message ??
          contractReset.error?.message ??
          'Failed to reset milestone state.'
      )
    }
  }

  await admin.from('audit_log').insert({
    contract_id: submission.contract_id,
    actor_id: user.id,
    event_type: 'submission.reviewed',
    payload: {
      milestone_id: submission.milestone_id,
      submission_id: submission.id,
      version: submission.version,
      verdict: params.verdict,
      feedback_count: params.feedbackItems?.length ?? 0,
    },
  })

  const verdictText =
    params.verdict === 'approved'
      ? 'approved'
      : params.verdict === 'revision_requested'
        ? 'sent back for revisions'
        : 'rejected'
  const preview =
    feedbackText && feedbackText.length > 120
      ? `${feedbackText.slice(0, 120)}...`
      : feedbackText

  await sendSystemMessage({
    contractId: submission.contract_id,
    body: preview
      ? `Submission v${submission.version} for "${milestone.title}" was ${verdictText}. Feedback: "${preview}"`
      : `Submission v${submission.version} for "${milestone.title}" was ${verdictText}.`,
    milestoneId: submission.milestone_id,
    messageType: 'feedback',
    actorId: user.id,
  }).catch(console.error)

  if (serviceProviderId) {
    await insertNotifications({
      user_id: serviceProviderId,
      contract_id: submission.contract_id,
      type:
        params.verdict === 'approved'
          ? 'submission_approved'
          : params.verdict === 'revision_requested'
            ? 'revision_requested'
            : 'submission_rejected',
      title:
        params.verdict === 'approved'
          ? 'Submission approved'
          : params.verdict === 'revision_requested'
            ? 'Revisions requested'
            : 'Submission rejected',
      body: `Your submission v${submission.version} for "${milestone.title}" was ${verdictText}.`,
      read: false,
    })
  }

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${submission.contract_id}`)
  revalidatePath(`/contracts/${submission.contract_id}/milestones`)
  revalidatePath(`/contracts/${submission.contract_id}/payments`)

  return { success: true, verdict: params.verdict, warning }
}
