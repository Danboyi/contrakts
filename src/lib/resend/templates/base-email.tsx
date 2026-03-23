import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { getAppUrl } from '@/lib/supabase/config'

interface BaseEmailProps {
  preview: string
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}

export function BaseEmail({
  preview,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  footerNote,
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: '#0A0A0B',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          margin: 0,
          padding: '24px 12px',
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <Section
            style={{
              backgroundColor: '#111113',
              borderBottom: '1px solid #2A2A30',
              borderRadius: '12px 12px 0 0',
              padding: '20px 32px',
            }}
          >
            <Text
              style={{
                color: '#F4F4F5',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
              }}
            >
              Contrakts
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#111113',
              borderRadius: '0 0 12px 12px',
              padding: '32px',
            }}
          >
            <Text
              style={{
                color: '#F4F4F5',
                fontSize: '22px',
                fontWeight: '600',
                lineHeight: '1.3',
                marginTop: 0,
                marginBottom: '16px',
              }}
            >
              {heading}
            </Text>

            <Text
              style={{
                color: '#A1A1AA',
                fontSize: '15px',
                lineHeight: '1.6',
                margin: '0 0 28px',
                whiteSpace: 'pre-line',
              }}
            >
              {body}
            </Text>

            {ctaLabel && ctaUrl && (
              <Button
                href={ctaUrl}
                style={{
                  backgroundColor: '#6366F1',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px 24px',
                  textDecoration: 'none',
                }}
              >
                {ctaLabel}
              </Button>
            )}
          </Section>

          <Section style={{ padding: '24px 32px 0' }}>
            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #2A2A30',
                marginBottom: '20px',
              }}
            />
            {footerNote && (
              <Text
                style={{
                  color: '#52525B',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  margin: '0 0 8px',
                }}
              >
                {footerNote}
              </Text>
            )}
            <Text
              style={{
                color: '#52525B',
                fontSize: '12px',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {`© ${new Date().getFullYear()} Contrakts - Every deal. Protected. `}
              <Link href={`${getAppUrl()}/settings`} style={{ color: '#71717A' }}>
                Manage notifications
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
