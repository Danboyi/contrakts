// SERVER-SIDE ONLY
import type { ReactElement } from 'react'
import * as React from 'react'
import { Resend } from 'resend'
import { BaseEmail } from '@/lib/resend/templates/base-email'
import { getAppUrl } from '@/lib/supabase/config'

let resendClient: Resend | null = null

function isConfigured(value?: string) {
  return Boolean(value && !value.startsWith('your_') && !value.includes('placeholder'))
}

function getResendClient() {
  if (!isConfigured(process.env.RESEND_API_KEY)) {
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: ReactElement
}) {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[Resend] Missing API key configuration. Email delivery is skipped.')
    return { error: 'Email delivery failed.' }
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Contrakts <contracts@contrakts.io>',
      to,
      subject,
      react,
    })

    if (error) {
      console.error('[Resend] Email send error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[Resend] Unexpected error:', error)
    return { error: 'Email delivery failed.' }
  }
}

type CounterpartySignedEmailInput = {
  to: string
  initiatorName: string
  counterpartyName: string
  contractId: string
  contractTitle: string
}

export async function sendCounterpartySignedEmail(
  input: CounterpartySignedEmailInput
) {
  const contractUrl = `${getAppUrl()}/contracts/${input.contractId}`

  return sendEmail({
    to: input.to,
    subject: `${input.counterpartyName} signed "${input.contractTitle}"`,
    react: React.createElement(BaseEmail, {
      preview: `${input.counterpartyName} signed "${input.contractTitle}"`,
      heading: 'Counterparty signed your contract',
      body: `Hi ${input.initiatorName},\n\n${input.counterpartyName} has signed "${input.contractTitle}".\n\nYou can now fund escrow and begin the contract.`,
      ctaLabel: 'View contract',
      ctaUrl: contractUrl,
    }),
  })
}
