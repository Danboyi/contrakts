import * as React from 'react'
import { BaseEmail } from './base-email'

interface RulingIssuedEmailProps {
  recipientName: string
  ruling: string
  rulingNotes: string
  contractTitle: string
  disputeUrl: string
}

export function RulingIssuedEmail({
  recipientName,
  ruling,
  rulingNotes,
  contractTitle,
  disputeUrl,
}: RulingIssuedEmailProps) {
  const rulingLabel =
    {
      vendor_wins: 'Vendor wins - full payment released',
      client_wins: 'Client wins - milestone reset for re-delivery',
      partial: 'Partial ruling - funds split per arbitrator decision',
      cancelled: 'Dispute cancelled',
    }[ruling] ?? ruling

  return (
    <BaseEmail
      preview={`Dispute ruling issued for ${contractTitle}`}
      heading="Arbitration ruling issued"
      body={`Hi ${recipientName},\n\nThe arbitrator has issued a ruling for the dispute on "${contractTitle}":\n\n${rulingLabel}\n\nArbitrator's reasoning:\n${rulingNotes}\n\nFunds have been distributed according to the ruling.`}
      ctaLabel="View ruling"
      ctaUrl={disputeUrl}
    />
  )
}
