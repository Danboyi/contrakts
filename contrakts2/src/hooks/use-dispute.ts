'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Dispute, DisputeEvidence } from '@/types'

type DisputeEvidenceWithSubmitter = DisputeEvidence & {
  submitter?: { full_name: string; avatar_url: string | null } | null
}

export interface DisputeWithEvidence extends Dispute {
  evidence: DisputeEvidenceWithSubmitter[]
  raiser?: { full_name: string; avatar_url: string | null } | null
  respondent?: { full_name: string; avatar_url: string | null } | null
  arbitrator?: { full_name: string } | null
  milestone?: { title: string; amount: number } | null
}

export function useDispute(
  contractId: string,
  initialDispute: DisputeWithEvidence | null = null
) {
  const [dispute, setDispute] = useState<DisputeWithEvidence | null>(initialDispute)
  const [loading, setLoading] = useState(initialDispute === null)

  const fetchDispute = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('disputes')
      .select(
        `
        *,
        evidence:dispute_evidence(
          *,
          submitter:users!submitted_by(full_name, avatar_url)
        ),
        raiser:users!raised_by(full_name, avatar_url),
        respondent:users!respondent_id(full_name, avatar_url),
        arbitrator:users!arbitrator_id(full_name),
        milestone:milestones!milestone_id(title, amount)
      `
      )
      .eq('contract_id', contractId)
      .order('raised_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setDispute((data ?? null) as unknown as DisputeWithEvidence | null)
    setLoading(false)
  }, [contractId])

  useEffect(() => {
    void fetchDispute()

    const supabase = createClient()
    const channel = supabase
      .channel(`dispute:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disputes',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          void fetchDispute()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispute_evidence',
        },
        () => {
          void fetchDispute()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contractId, fetchDispute])

  return { dispute, loading, refetch: fetchDispute }
}
