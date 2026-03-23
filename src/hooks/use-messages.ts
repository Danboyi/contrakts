'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Message } from '@/types'

export function useMessages(contractId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!isSupabaseConfigured() || !contractId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:users!sender_id(
          id, full_name, email, avatar_url
        )
      `
      )
      .eq('contract_id', contractId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setMessages(((data ?? []) as unknown as Message[]) ?? [])
    setError(null)
    setLoading(false)
  }, [contractId])

  const countUnread = useCallback(
    async (userId: string) => {
      if (!isSupabaseConfigured() || !contractId) {
        return
      }

      const supabase = createClient()
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contractId)
        .eq('read_by_recipient', false)
        .neq('sender_id', userId)
        .is('deleted_at', null)

      setUnreadCount(count ?? 0)
    },
    [contractId]
  )

  const markAllRead = useCallback(async (userId: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.sender_id !== userId && !message.read_by_recipient
          ? {
              ...message,
              read_by_recipient: true,
              read_at: new Date().toISOString(),
            }
          : message
      )
    )
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    void fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!isSupabaseConfigured() || !contractId) {
      return
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(
              `
              *,
              sender:users!sender_id(
                id, full_name, email, avatar_url
              )
            `
            )
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((current) => {
              if (current.some((item) => item.id === data.id)) {
                return current
              }

              return [...current, data as unknown as Message]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void fetchMessages()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return {
    messages,
    loading,
    error,
    unreadCount,
    bottomRef,
    refetch: fetchMessages,
    markAllRead,
    countUnread,
  }
}
