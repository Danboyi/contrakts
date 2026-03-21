'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Contract, Milestone } from '@/types'

type ContractRecord = Contract & {
  initiator?: Contract['initiator'] | null
  counterparty?: Contract['counterparty'] | null
  milestones?: Milestone[]
}

export function useContract(contractId: string) {
  const [contract, setContract] = useState<ContractRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        initiator:users!initiator_id(*),
        counterparty:users!counterparty_id(*),
        milestones(
          *,
          deliverables(*)
        )
      `
      )
      .eq('id', contractId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const nextContract = data as unknown as ContractRecord

    if (nextContract?.milestones) {
      nextContract.milestones = [...nextContract.milestones].sort(
        (a: Milestone, b: Milestone) => a.order_index - b.order_index
      )
    }

    setContract(nextContract)
    setError(null)
    setLoading(false)
  }, [contractId])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!mounted) {
        return
      }
      await fetchContract()
    }

    load()

    if (!isSupabaseConfigured()) {
      return () => {
        mounted = false
      }
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`contract:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        () => {
          void fetchContract()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void fetchContract()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [contractId, fetchContract])

  return { contract, loading, error, refetch: fetchContract }
}
