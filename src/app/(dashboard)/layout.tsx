import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (profileData ?? null) as User | null

  if (!profile) {
    return (
      <DashboardShell
        profile={{
          id: user.id,
          full_name: user.email ?? 'User',
          email: user.email ?? '',
          phone: null,
          avatar_url: null,
          kyc_status: 'unverified',
          trust_score: 100,
          total_contracts: 0,
          completed_count: 0,
          dispute_count: 0,
          paystack_recipient_code: null,
          bank_account_number: null,
          bank_code: null,
          bank_name: null,
          wallet_address: null,
          preferred_payout: 'fiat',
          created_at: new Date().toISOString(),
        }}
      >
        {children}
      </DashboardShell>
    )
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
