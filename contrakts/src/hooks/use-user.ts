'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(
    async (supabaseClient: ReturnType<typeof createClient>, userId: string) => {
      const { data } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      setUser((data as User | null) ?? null)
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let active = true
    let profileChannel: ReturnType<typeof supabase.channel> | null = null

    async function subscribeToProfile(userId: string) {
      if (profileChannel) {
        await supabase.removeChannel(profileChannel)
        profileChannel = null
      }

      if (!active) {
        return
      }

      profileChannel = supabase
        .channel(`user:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          () => {
            void fetchProfile(supabase, userId)
          }
        )
        .subscribe()
    }

    async function hydrateUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      await fetchProfile(supabase, authUser.id)
      await subscribeToProfile(authUser.id)
    }

    void hydrateUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) {
        return
      }

      if (event === 'SIGNED_OUT') {
        if (profileChannel) {
          await supabase.removeChannel(profileChannel)
          profileChannel = null
        }
        setUser(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        await fetchProfile(supabase, session.user.id)
        await subscribeToProfile(session.user.id)
      }

      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
      if (profileChannel) {
        void supabase.removeChannel(profileChannel)
      }
    }
  }, [fetchProfile])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return
    }

    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    await fetchProfile(supabase, authUser.id)
  }, [fetchProfile])

  return { user, loading, refresh }
}
