'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Milestone } from '@/types'

export function useMilestones(
  contractId: string,
  initialMilestones: Milestone[] = []
) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [loading, setLoading] = useState(initialMilestones.length === 0)

  const fetchMilestones = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('milestones')
      .select('*, deliverables(*)')
      .eq('contract_id', contractId)
      .order('order_index', { ascending: true })

    setMilestones(((data ?? []) as unknown as Milestone[]))
    setLoading(false)
  }, [contractId])

  useEffect(() => {
    void fetchMilestones()

    const supabase = createClient()
    const channel = supabase
      .channel(`milestones:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void fetchMilestones()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverables',
        },
        () => {
          void fetchMilestones()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId, fetchMilestones])

  const activeMilestone =
    milestones.find((milestone) =>
      ['in_progress', 'submitted', 'disputed', 'approved'].includes(milestone.state)
    ) ?? null

  const paidMilestones = milestones.filter((milestone) => milestone.state === 'paid')
  const pendingMilestones = milestones.filter(
    (milestone) => milestone.state === 'pending'
  )

  return {
    milestones,
    loading,
    activeMilestone,
    paidMilestones,
    pendingMilestones,
    refetch: fetchMilestones,
  }
}
