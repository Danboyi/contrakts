import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminDashboardClient } from './admin-dashboard-client'

export const metadata = { title: 'Overview \u00b7 Admin' }

export default async function AdminPage() {
  await requireAdmin('arbitrator')

  const supabaseAdmin = createAdminClient()
  const [{ data: metricView }, disputesResult, activityResult, { data: contracts }, usersCountResult] =
    await Promise.all([
      supabaseAdmin.from('platform_metrics').select('*').maybeSingle(),
      supabaseAdmin
        .from('disputes')
        .select(
          `
            id,
            status,
            raised_at,
            contract:contracts(id, ref_code, title, currency),
            milestone:milestones!milestone_id(title, amount)
          `,
          { count: 'exact' }
        )
        .in('status', ['open', 'awaiting_response', 'under_review'])
        .order('raised_at', { ascending: true })
        .limit(5),
      supabaseAdmin
        .from('audit_log')
        .select('id, event_type, payload, created_at, actor:users!actor_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin.from('contracts').select('state'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    ])

  const disputes = (disputesResult.data ?? []) as unknown as Array<{
    id: string
    status: string
    raised_at: string
    contract: {
      id: string
      ref_code: string
      title: string
      currency: string
    } | null
    milestone: {
      title: string
      amount: number
    } | null
  }>

  const activity = (activityResult.data ?? []) as unknown as Array<{
    id: string
    event_type: string
    payload: Record<string, unknown> | null
    created_at: string
    actor: { full_name: string } | null
  }>

  const contractRows = contracts ?? []
  const stateCount = contractRows.reduce<Record<string, number>>((acc, contract) => {
    acc[contract.state] = (acc[contract.state] ?? 0) + 1
    return acc
  }, {})

  const metrics = {
    total_contracts: metricView?.total_contracts ?? contractRows.length,
    active_contracts: metricView?.active_contracts ?? (stateCount.active ?? 0),
    completed_contracts: metricView?.completed_contracts ?? (stateCount.complete ?? 0),
    disputed_contracts: metricView?.disputed_contracts ?? (stateCount.disputed ?? 0),
    open_disputes: metricView?.open_disputes ?? disputesResult.count ?? 0,
    total_users: metricView?.total_users ?? usersCountResult.count ?? 0,
    total_revenue: metricView?.total_revenue ?? 0,
    total_escrow_volume: metricView?.total_escrow_volume ?? 0,
  }

  return (
    <AdminDashboardClient
      metrics={metrics}
      disputes={disputes}
      activity={activity}
      stateCount={stateCount}
      totalContracts={contractRows.length}
    />
  )
}
