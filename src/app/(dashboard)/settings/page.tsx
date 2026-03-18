import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import { createClient } from '@/lib/supabase/server'
import type { NotificationPreference, User } from '@/types'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profileData, preferencesData] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id),
  ])

  const profile = (profileData.data ?? null) as User | null
  if (!profile) {
    redirect('/login')
  }

  return (
    <SettingsClient
      profile={profile}
      initialPreferences={(preferencesData.data ?? []) as NotificationPreference[]}
    />
  )
}
