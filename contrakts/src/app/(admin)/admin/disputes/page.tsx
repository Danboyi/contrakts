import { AdminDisputeQueue, type QueueDispute } from './admin-dispute-queue'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Arbitration queue - Admin' }

export default async function AdminDisputesPage() {
  const admin = await requireAdmin('arbitrator')

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

  return (
    <AdminDisputeQueue
      disputes={(disputes ?? []) as unknown as QueueDispute[]}
      currentUserId={admin.id}
    />
  )
}
