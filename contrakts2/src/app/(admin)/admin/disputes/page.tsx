import { AdminDisputeQueue, type QueueDispute } from './admin-dispute-queue'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Disputes \u00b7 Admin' }

export default async function AdminDisputesPage() {
  await requireAdmin('arbitrator')

  const supabaseAdmin = createAdminClient()
  const { data: disputes } = await supabaseAdmin
    .from('disputes')
    .select(
      `
        *,
        contract:contracts(id, ref_code, title, currency),
        milestone:milestones!milestone_id(id, title, amount),
        raiser:users!raised_by(full_name, email),
        respondent:users!respondent_id(full_name, email),
        evidence:dispute_evidence(
          id,
          submitted_by,
          file_name,
          description,
          created_at,
          submitter:users!submitted_by(full_name)
        )
      `
    )
    .in('status', ['open', 'awaiting_response', 'under_review', 'clarification', 'appealed'])
    .order('raised_at', { ascending: true })

  const disputeIds = (disputes ?? []).map((dispute: { id: string }) => dispute.id)
  let analysisMap: Record<
    string,
    {
      dispute_id: string
      recommended_ruling: string
      confidence: number
      auto_resolvable: boolean
      applied: boolean
    }
  > = {}

  if (disputeIds.length > 0) {
    const { data: analyses } = await supabaseAdmin
      .from('dispute_ai_analyses')
      .select(
        'dispute_id, recommended_ruling, confidence, auto_resolvable, applied'
      )
      .in('dispute_id', disputeIds)

    analysisMap = Object.fromEntries(
      (analyses ?? []).map(
        (analysis: {
          dispute_id: string
          recommended_ruling: string
          confidence: number
          auto_resolvable: boolean
          applied: boolean
        }) => [analysis.dispute_id, analysis]
      )
    )
  }

  return (
    <AdminDisputeQueue
      disputes={(disputes ?? []) as unknown as QueueDispute[]}
      analysisMap={analysisMap}
    />
  )
}
