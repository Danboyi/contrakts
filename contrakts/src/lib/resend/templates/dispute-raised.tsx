import * as React from 'react'
import { BaseEmail } from './base-email'

interface DisputeRaisedEmailProps {
  recipientName: string
  raisedBy: string
  milestoneTitle: string
  contractTitle: string
  reason: string
  disputeUrl: string
  isRespondent: boolean
}

export function DisputeRaisedEmail({
  recipientName,
  raisedBy,
  milestoneTitle,
  contractTitle,
  reason,
  disputeUrl,
  isRespondent,
}: DisputeRaisedEmailProps) {
  const body = isRespondent
    ? `Hi ${recipientName},\n\nA dispute has been raised by ${raisedBy} on:\n\n"${milestoneTitle}" - ${contractTitle}\n\nReason: ${reason}\n\nYou have 48 hours to respond with your evidence and position. The milestone payment is frozen until the dispute is resolved.`
    : `Hi ${recipientName},\n\nYour dispute on "${milestoneTitle}" has been received.\n\nThe other party has 48 hours to respond. A Contrakts arbitrator will then review the evidence from both sides and issue a ruling.`

  return (
    <BaseEmail
      preview={
        isRespondent ? 'Dispute raised - respond within 48 hours' : 'Dispute submitted'
      }
      heading={isRespondent ? 'Dispute raised - response required' : 'Dispute opened'}
      body={body}
      ctaLabel={isRespondent ? 'Submit your response' : 'View dispute'}
      ctaUrl={disputeUrl}
      footerNote="Funds are frozen until this dispute is resolved by arbitration."
    />
  )
}
