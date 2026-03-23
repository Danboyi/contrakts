import * as React from 'react'
import { sendEmail } from '@/lib/resend/client'
import {
  ContractFundedEmail,
  ContractInviteEmail,
  DisputeRaisedEmail,
  MilestoneSubmittedEmail,
  RulingIssuedEmail,
} from '@/lib/resend/templates'
import { getNotificationConfig } from '@/lib/notifications/registry'
import { isNotificationChannelEnabled } from '@/lib/notifications/store'
import {
  ROLE_LABELS,
  getCounterpartyRole,
  type PartyRole,
} from '@/lib/types/negotiation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/supabase/config'
import { formatCurrency } from '@/lib/utils/format-currency'

const APP_URL = getAppUrl()

type UserContact = {
  id: string
  full_name: string
  email: string
}

async function getUserContact(userId: string | null): Promise<UserContact | null> {
  if (!userId) {
    return null
  }

  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('id', userId)
    .maybeSingle()

  return (data as UserContact | null) ?? null
}

async function canEmailUser(userId: string | null, notificationType: string) {
  if (!userId) {
    return false
  }

  return isNotificationChannelEnabled(userId, notificationType, 'email')
}

export async function sendContractInviteEmail({
  toEmail,
  toName,
  initiatorName,
  contractTitle,
  totalValue,
  currency,
  inviteToken,
  initiatorRole,
  inviteMessage,
}: {
  toEmail: string
  toName: string
  initiatorName: string
  contractTitle: string
  totalValue: number
  currency: string
  inviteToken: string
  initiatorRole: PartyRole
  inviteMessage?: string
}) {
  const inviteeRole = getCounterpartyRole(initiatorRole)

  await sendEmail({
    to: toEmail,
    subject: `${initiatorName} invited you to a contract on Contrakts`,
    react: React.createElement(ContractInviteEmail, {
      inviteeName: toName,
      initiatorName,
      contractTitle,
      contractValue: formatCurrency(totalValue, currency),
      inviteUrl: `${APP_URL}/invite/${inviteToken}`,
      initiatorRoleLabel: ROLE_LABELS[initiatorRole],
      inviteeRoleLabel: ROLE_LABELS[inviteeRole],
      inviteMessage,
    }),
  })
}

export async function sendContractFundedEmails(contractId: string) {
  const supabaseAdmin = createAdminClient()
  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('id, title, total_value, currency, initiator_id, counterparty_id')
    .eq('id', contractId)
    .maybeSingle()

  if (!contract) {
    return
  }

  const initiator = await getUserContact(contract.initiator_id)
  const counterparty = await getUserContact(contract.counterparty_id)
  const contractUrl = `${APP_URL}/contracts/${contractId}`
  const contractValue = formatCurrency(contract.total_value, contract.currency)

  if (
    initiator?.email &&
    (await canEmailUser(initiator.id, 'contract_funded'))
  ) {
    await sendEmail({
      to: initiator.email,
      subject: getNotificationConfig('contract_funded').emailSubject({}),
      react: React.createElement(ContractFundedEmail, {
        recipientName: initiator.full_name,
        contractTitle: contract.title,
        contractValue,
        contractUrl,
        role: 'client',
      }),
    })
  }

  if (
    counterparty?.email &&
    (await canEmailUser(counterparty.id, 'contract_funded'))
  ) {
    await sendEmail({
      to: counterparty.email,
      subject: getNotificationConfig('contract_funded').emailSubject({}),
      react: React.createElement(ContractFundedEmail, {
        recipientName: counterparty.full_name,
        contractTitle: contract.title,
        contractValue,
        contractUrl,
        role: 'vendor',
      }),
    })
  }
}

export async function sendMilestoneSubmittedEmail({
  contractId,
  milestoneId,
}: {
  contractId: string
  milestoneId: string
}) {
  const supabaseAdmin = createAdminClient()
  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select(
      'id, title, currency, initiator_id, counterparty_id, initiator_role, service_provider_id, service_receiver_id'
    )
    .eq('id', contractId)
    .maybeSingle()
  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('title, amount')
    .eq('id', milestoneId)
    .maybeSingle()

  if (!contract || !milestone) {
    return
  }

  const serviceReceiverId =
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)
  const serviceProviderId =
    contract.service_provider_id ??
    (contract.initiator_role === 'service_provider'
      ? contract.initiator_id
      : contract.counterparty_id)

  const client = await getUserContact(serviceReceiverId)
  const vendor = await getUserContact(serviceProviderId)

  if (!client?.email || !(await canEmailUser(client.id, 'milestone_submitted'))) {
    return
  }

  await sendEmail({
    to: client.email,
    subject: getNotificationConfig('milestone_submitted').emailSubject({}),
    react: React.createElement(MilestoneSubmittedEmail, {
      clientName: client.full_name,
      vendorName: vendor?.full_name ?? 'Service Provider',
      milestoneTitle: milestone.title,
      contractTitle: contract.title,
      amount: formatCurrency(milestone.amount, contract.currency),
      reviewUrl: `${APP_URL}/contracts/${contractId}/milestones`,
    }),
  })
}

export async function sendDisputeRaisedEmails(disputeId: string) {
  const supabaseAdmin = createAdminClient()
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('id, contract_id, milestone_id, reason, raised_by, respondent_id')
    .eq('id', disputeId)
    .maybeSingle()

  if (!dispute) {
    return
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('title')
    .eq('id', dispute.contract_id)
    .maybeSingle()
  const { data: milestone } = await supabaseAdmin
    .from('milestones')
    .select('title')
    .eq('id', dispute.milestone_id)
    .maybeSingle()

  const raiser = await getUserContact(dispute.raised_by)
  const respondent = await getUserContact(dispute.respondent_id)
  const disputeUrl = `${APP_URL}/contracts/${dispute.contract_id}/dispute`
  const readableReason = dispute.reason.replaceAll('_', ' ')

  if (
    respondent?.email &&
    (await canEmailUser(respondent.id, 'dispute_raised'))
  ) {
    await sendEmail({
      to: respondent.email,
      subject: 'Dispute raised - respond within 48 hours',
      react: React.createElement(DisputeRaisedEmail, {
        recipientName: respondent.full_name,
        raisedBy: raiser?.full_name ?? 'Other party',
        milestoneTitle: milestone?.title ?? 'Milestone',
        contractTitle: contract?.title ?? 'Contract',
        reason: readableReason,
        disputeUrl,
        isRespondent: true,
      }),
    })
  }

  if (raiser?.email && (await canEmailUser(raiser.id, 'dispute_raised'))) {
    await sendEmail({
      to: raiser.email,
      subject: `Dispute submitted - ${contract?.title ?? 'Contract'}`,
      react: React.createElement(DisputeRaisedEmail, {
        recipientName: raiser.full_name,
        raisedBy: raiser.full_name,
        milestoneTitle: milestone?.title ?? 'Milestone',
        contractTitle: contract?.title ?? 'Contract',
        reason: readableReason,
        disputeUrl,
        isRespondent: false,
      }),
    })
  }
}

export async function sendRulingIssuedEmails(disputeId: string) {
  const supabaseAdmin = createAdminClient()
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('id, contract_id, ruling, ruling_notes, raised_by, respondent_id')
    .eq('id', disputeId)
    .maybeSingle()

  if (!dispute) {
    return
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('title')
    .eq('id', dispute.contract_id)
    .maybeSingle()

  const raiser = await getUserContact(dispute.raised_by)
  const respondent = await getUserContact(dispute.respondent_id)
  const disputeUrl = `${APP_URL}/contracts/${dispute.contract_id}/dispute`

  for (const recipient of [raiser, respondent]) {
    if (!recipient?.email) {
      continue
    }

    if (!(await canEmailUser(recipient.id, 'dispute_resolved'))) {
      continue
    }

    await sendEmail({
      to: recipient.email,
      subject: `Dispute ruling issued - ${contract?.title ?? 'Contract'}`,
      react: React.createElement(RulingIssuedEmail, {
        recipientName: recipient.full_name,
        ruling: dispute.ruling ?? '',
        rulingNotes: dispute.ruling_notes ?? '',
        contractTitle: contract?.title ?? 'Contract',
        disputeUrl,
      }),
    })
  }
}
