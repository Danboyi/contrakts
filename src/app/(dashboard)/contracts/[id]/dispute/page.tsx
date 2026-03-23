import { notFound, redirect } from 'next/navigation'
import type { AiDisputeAnalysis } from '@/lib/ai/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DisputePageClient } from './dispute-page-client'
import type { Contract, Milestone } from '@/types'
import type { DisputeWithEvidence } from '@/hooks/use-dispute'

type DisputeContract = Contract & {
  initiator: NonNullable<Contract['initiator']> | null
  counterparty: NonNullable<Contract['counterparty']> | null
  milestones: Milestone[]
}

export const metadata = { title: 'Dispute' }

export default async function DisputePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { milestone?: string; fee_paid?: string }
}) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: contractData } = await supabase
    .from('contracts')
    .select(
      `
      *,
      initiator:users!initiator_id(id, full_name, avatar_url),
      counterparty:users!counterparty_id(id, full_name, avatar_url),
      milestones(*, deliverables(*))
    `
    )
    .eq('id', params.id)
    .single()

  const contract = contractData as DisputeContract | null

  if (!contract) {
    notFound()
  }

  const isParty =
    contract.initiator_id === user.id || contract.counterparty_id === user.id

  if (!isParty) {
    notFound()
  }

  const { data: disputeData } = await supabase
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
    .eq('contract_id', params.id)
    .order('raised_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const milestones = [...(contract.milestones ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  let aiAnalysis: AiDisputeAnalysis | null = null
  if (disputeData?.id) {
    const { data: analysisData } = await supabaseAdmin
      .from('dispute_ai_analyses')
      .select('*')
      .eq('dispute_id', disputeData.id)
      .maybeSingle()

    if (analysisData) {
      aiAnalysis = analysisData as unknown as AiDisputeAnalysis
    }
  }

  return (
    <DisputePageClient
      contract={{ ...contract, milestones }}
      currentUserId={user.id}
      initialDispute={(disputeData ?? null) as unknown as DisputeWithEvidence | null}
      aiAnalysis={aiAnalysis}
      initialMilestoneId={searchParams.milestone}
      feePaid={searchParams.fee_paid === '1'}
    />
  )
}
