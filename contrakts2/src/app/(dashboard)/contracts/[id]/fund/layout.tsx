import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fund escrow',
}

export default function FundEscrowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
