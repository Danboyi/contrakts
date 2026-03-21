import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New template',
}

export default function NewTemplateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
