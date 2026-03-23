'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return null
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const list = (data ?? []) as Notification[]
    setNotifications(list)
    setUnreadCount(list.filter((notification) => !notification.read).length)
    setLoading(false)
    return user.id
  }, [])

  useEffect(() => {
    let active = true
    const supabase = createClient()
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null

    async function init() {
      const userId = await fetchNotifications()
      if (!active || !userId) {
        return
      }

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void fetchNotifications()
          }
        )
        .subscribe()
    }

    void init()

    return () => {
      active = false
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [fetchNotifications])

  async function markRead(id: string) {
    const current = notifications.find((notification) => notification.id === id)
    if (!current || current.read) {
      return
    }

    const supabase = createClient()
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
    setUnreadCount((previous) => Math.max(0, previous - 1))

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) {
      await fetchNotifications()
    }
  }

  async function markAllRead() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    const hasUnread = notifications.some((notification) => !notification.read)
    if (!hasUnread) {
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    )
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      await fetchNotifications()
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  }
}
