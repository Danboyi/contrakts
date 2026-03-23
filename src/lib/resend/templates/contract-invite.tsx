import * as React from 'react'
import { BaseEmail } from './base-email'

interface ContractInviteEmailProps {
  inviteeName: string
  initiatorName: string
  contractTitle: string
  contractValue: string
  inviteUrl: string
  initiatorRoleLabel: string
  inviteeRoleLabel: string
  inviteMessage?: string
}

export function ContractInviteEmail({
  inviteeName,
  initiatorName,
  contractTitle,
  contractValue,
  inviteUrl,
  initiatorRoleLabel,
  inviteeRoleLabel,
  inviteMessage,
}: ContractInviteEmailProps) {
  return (
    <BaseEmail
      preview={`${initiatorName} invited you to a contract on Contrakts`}
      heading="You have been invited to a contract"
      body={`Hi ${inviteeName},\n\n${initiatorName} has sent you a contract on Contrakts.\n\nContract: "${contractTitle}" - ${contractValue}\nYour role: ${inviteeRoleLabel}\nTheir role: ${initiatorRoleLabel}\n\n${inviteMessage ? `Message from ${initiatorName}: ${inviteMessage}\n\n` : ''}Review the contract terms, accept them or suggest changes, and continue once you are ready.`}
      ctaLabel="Review contract"
      ctaUrl={inviteUrl}
      footerNote="This invite was sent because someone added your email to a Contrakts contract. If you do not know this person, you can safely ignore this email."
    />
  )
}
