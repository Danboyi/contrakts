'use server'

import { revalidatePath } from 'next/cache'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { sendSystemMessage } from '@/lib/messages'
import { sendMilestoneSubmittedEmail } from '@/lib/notifications/dispatch'
import { insertNotifications } from '@/lib/notifications/store'
import { releaseMilestonePayment } from '@/lib/payments/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type MilestoneActionResult = {
  error?: string
  success?: boolean
}

type SubmissionFile = {
  path: string
  name: string
  type: string
}

function getServiceProviderId(contract: {
  initiator_id: string
  counterparty_id: string | null
  initiator_role: string
  service_provider_id: string | null
}) {
  return (
    contract.service_provider_id ??
    (contract.initiator_role === 'service_provider'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

function getServiceReceiverId(contract: {
  initiator_id: string
  counterparty_id: string | null
  initiator_role: string
  service_receiver_id: string | null
}) {
  return (
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)
  )
}

export async function submitDelivery(
  milestoneId: string,
  note: string,
  filePaths: SubmissionFile[]
): Promise<MilestoneActionResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: milestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (!milestone) {
    return { error: 'Milestone not found.' }
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', milestone.contract_id)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  const serviceProviderId = getServiceProviderId(contract)
  const serviceReceiverId = getServiceReceiverId(contract)

  if (serviceProviderId !== user.id) {
    return { error: 'Only the service provider can submit deliverables.' }
  }

  if (milestone.state !== 'in_progress') {
    return { error: 'This milestone is not ready for delivery submission.' }
  }

  if (filePaths.length > 5) {
    return { error: 'You can upload up to 5 files per submission.' }
  }

  if (filePaths.length === 0 && !note.trim()) {
    return { error: 'Add at least one file or a note to submit.' }
  }

  for (const file of filePaths) {
    if (!file.path.startsWith(`${contract.id}/${milestoneId}/`)) {
      return { error: 'One or more uploaded files are invalid for this milestone.' }
    }
  }

  const now = new Date().toISOString()
  const previousContractState = contract.state

  const { error: milestoneError } = await supabase
    .from('milestones')
    .update({
      state: 'submitted',
      submitted_at: now,
    })
    .eq('id', milestoneId)
    .eq('state', 'in_progress')

  if (milestoneError) {
    return { error: 'Failed to update milestone.' }
  }

  const { error: contractError } = await supabase
    .from('contracts')
    .update({ state: 'in_review' })
    .eq('id', contract.id)

  if (contractError) {
    await supabase
      .from('milestones')
      .update({ state: 'in_progress', submitted_at: null })
      .eq('id', milestoneId)

    return { error: 'Failed to move the contract into review.' }
  }

  const noteValue = note.trim()
  const deliverables: Array<{
    milestone_id: string
    submitted_by: string
    file_url: string | null
    file_name: string | null
    file_type: string | null
    note: string | null
  }> = filePaths.length
    ? filePaths.map((file) => ({
        milestone_id: milestoneId,
        submitted_by: user.id,
        file_url: file.path,
        file_name: file.name,
        file_type: file.type,
        note: noteValue || null,
      }))
    : [
        {
          milestone_id: milestoneId,
          submitted_by: user.id,
          file_url: null,
          file_name: null,
          file_type: null,
          note: noteValue,
        },
      ]

  const { error: deliverableError } = await supabase
    .from('deliverables')
    .insert(deliverables)

  if (deliverableError) {
    await supabase
      .from('milestones')
      .update({ state: 'in_progress', submitted_at: null })
      .eq('id', milestoneId)

    await supabase
      .from('contracts')
      .update({ state: previousContractState })
      .eq('id', contract.id)

    return { error: 'Failed to save deliverables.' }
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: user.id,
    event_type: 'milestone.submitted',
    payload: {
      milestone_id: milestoneId,
      milestone_title: milestone.title,
      file_count: filePaths.length,
      has_note: Boolean(noteValue),
    },
  })

  await insertNotifications({
    user_id: serviceReceiverId ?? contract.initiator_id,
    contract_id: contract.id,
    type: 'milestone_submitted',
    title: 'Delivery submitted',
    body: `${milestone.title} has been submitted for your review. You have 72 hours to approve or raise a dispute.`,
  })

  await sendSystemMessage({
    contractId: contract.id,
    body: `${milestone.title} was submitted for review.`,
    milestoneId,
    messageType: 'submission',
    actorId: user.id,
  }).catch(console.error)

  await sendMilestoneSubmittedEmail({
    contractId: contract.id,
    milestoneId,
  }).catch(console.error)

  await notifyContractEvent(contract.id, 'milestone.submitted', {
    milestone_id: milestoneId,
  }).catch(console.error)

  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath(`/contracts/${contract.id}/milestones`)
  return { success: true }
}

export async function approveMilestone(
  milestoneId: string
): Promise<MilestoneActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: milestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (!milestone) {
    return { error: 'Milestone not found.' }
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', milestone.contract_id)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  const serviceReceiverId = getServiceReceiverId(contract)

  if (serviceReceiverId !== user.id) {
    return { error: 'Only the service receiver can approve deliverables.' }
  }

  if (milestone.state !== 'submitted') {
    return { error: 'This milestone has not been submitted yet.' }
  }

  const result = await releaseMilestonePayment(milestoneId, false)
  if (result.error) {
    return { error: result.error }
  }

  await sendSystemMessage({
    contractId: contract.id,
    body: `${milestone.title} was approved and payment released.`,
    milestoneId,
    messageType: 'system',
    actorId: user.id,
  }).catch(console.error)

  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath(`/contracts/${contract.id}/milestones`)
  revalidatePath(`/contracts/${contract.id}/payments`)
  return { success: true }
}

export async function getDeliverableUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data, error } = await supabase.storage
    .from('deliverables')
    .createSignedUrl(filePath, 3600)

  if (error) {
    return { error: error.message }
  }

  return { url: data.signedUrl }
}
