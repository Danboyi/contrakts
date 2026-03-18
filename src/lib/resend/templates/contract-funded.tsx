import * as React from 'react'
import { BaseEmail } from './base-email'

interface ContractFundedEmailProps {
  recipientName: string
  contractTitle: string
  contractValue: string
  contractUrl: string
  role: 'vendor' | 'client'
}

export function ContractFundedEmail({
  recipientName,
  contractTitle,
  contractValue,
  contractUrl,
  role,
}: ContractFundedEmailProps) {
  const body =
    role === 'vendor'
      ? `Hi ${recipientName},\n\nGreat news - the escrow for "${contractTitle}" has been funded with ${contractValue}.\n\nYou can now begin work. Your payment is secured and will be released when each milestone is approved.`
      : `Hi ${recipientName},\n\nYour escrow deposit of ${contractValue} for "${contractTitle}" has been confirmed.\n\nThe vendor has been notified and work can now begin.`

  return (
    <BaseEmail
      preview={`Escrow funded - ${contractTitle}`}
      heading="Escrow funded"
      body={body}
      ctaLabel="View contract"
      ctaUrl={contractUrl}
    />
  )
}
