'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/types'

export function useEscrow(contractId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })

      setPayments((data ?? []) as Payment[])
      setLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`payments:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void load()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId])

  const deposited = payments
    .filter(
      (payment) =>
        payment.payment_type === 'escrow_deposit' &&
        payment.provider_status === 'success'
    )
    .reduce((sum, payment) => sum + payment.gross_amount, 0)

  const released = payments
    .filter(
      (payment) =>
        payment.payment_type === 'milestone_release' &&
        payment.provider_status === 'success'
    )
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  const fees = payments
    .filter((payment) => payment.payment_type === 'platform_fee')
    .reduce((sum, payment) => sum + payment.net_amount, 0)

  return { payments, loading, deposited, released, fees }
}
