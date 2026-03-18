import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'
import { getTrustBreakdown } from '@/lib/profile/actions'
import { createClient } from '@/lib/supabase/server'
import type { Contract, User } from '@/types'

export const metadata = { title: 'Profile' }

type ProfileContract = Pick<
  Contract,
  'id' | 'ref_code' | 'title' | 'state' | 'currency' | 'total_value' | 'created_at'
>

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profileData, contractsData, breakdown] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('contracts')
      .select('id, ref_code, title, state, currency, total_value, created_at')
      .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    getTrustBreakdown(user.id),
  ])

  const profile = (profileData.data ?? null) as User | null
  if (!profile) {
    redirect('/login')
  }

  return (
    <ProfileClient
      profile={profile}
      contracts={(contractsData.data ?? []) as ProfileContract[]}
      breakdown={breakdown}
    />
  )
}
