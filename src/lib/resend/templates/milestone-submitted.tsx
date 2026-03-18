import * as React from 'react'
import { BaseEmail } from './base-email'

interface MilestoneSubmittedEmailProps {
  clientName: string
  vendorName: string
  milestoneTitle: string
  contractTitle: string
  amount: string
  reviewUrl: string
}

export function MilestoneSubmittedEmail({
  clientName,
  vendorName,
  milestoneTitle,
  contractTitle,
  amount,
  reviewUrl,
}: MilestoneSubmittedEmailProps) {
  return (
    <BaseEmail
      preview={`${vendorName} submitted a delivery for your review`}
      heading="Delivery ready for review"
      body={`Hi ${clientName},\n\n${vendorName} has submitted their delivery for:\n\n"${milestoneTitle}" on ${contractTitle}\n\nAmount: ${amount}\n\nYou have 72 hours to approve or raise a dispute. If no action is taken, payment will be automatically released.`}
      ctaLabel="Review delivery"
      ctaUrl={reviewUrl}
      footerNote="Payment auto-releases after 72 hours if no action is taken."
    />
  )
}
