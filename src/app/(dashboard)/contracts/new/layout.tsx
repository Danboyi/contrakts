import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New contract',
}

export default function NewContractLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
