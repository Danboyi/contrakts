import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developers',
}

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
