import * as React from 'react'
import { BaseEmail } from './base-email'

interface ContractInviteEmailProps {
  inviteeName: string
  initiatorName: string
  contractTitle: string
  contractValue: string
  inviteUrl: string
}

export function ContractInviteEmail({
  inviteeName,
  initiatorName,
  contractTitle,
  contractValue,
  inviteUrl,
}: ContractInviteEmailProps) {
  return (
    <BaseEmail
      preview={`${initiatorName} invited you to a contract on Contrakts`}
      heading="You have been invited to a contract"
      body={`Hi ${inviteeName},\n\n${initiatorName} has sent you a contract on Contrakts:\n\n"${contractTitle}" - ${contractValue}\n\nReview the contract terms and sign to get started. Your payment is protected by Contrakts escrow.`}
      ctaLabel="Review and sign"
      ctaUrl={inviteUrl}
      footerNote="This invite was sent because someone added your email to a Contrakts contract. If you do not know this person, you can safely ignore this email."
    />
  )
}
