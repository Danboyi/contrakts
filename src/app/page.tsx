import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    absolute: 'Contrakts — Every deal. Protected.',
  },
  description:
    'Create contracts with AI. Protect payments with escrow. ' +
    'Resolve disputes with AI arbitration. Free to start.',
  openGraph: {
    title: 'Contrakts — Every deal. Protected.',
    description:
      'Create contracts with AI. Protect payments with escrow. ' +
      'Resolve disputes with AI arbitration. Free to start.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contrakts — Every deal. Protected.',
    description:
      'Create contracts with AI. Protect payments with escrow. ' +
      'Resolve disputes with AI arbitration. Free to start.',
  },
}

export default async function RootPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  }

  return <LandingPage />
}
