import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Developers',
}

export default function DevelopersLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
