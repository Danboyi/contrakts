import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminContractsClient } from './admin-contracts-client'

export const metadata = { title: 'Contracts - Admin' }

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams: { state?: string; q?: string; page?: string }
}) {
  await requireAdmin('arbitrator')

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10))
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabaseAdmin = createAdminClient()
  let query = supabaseAdmin
    .from('contracts')
    .select(
      `
        id,
        ref_code,
        title,
        state,
        currency,
        total_value,
        created_at,
        initiator:users!initiator_id(full_name, email)
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.state) {
    query = query.eq('state', searchParams.state)
  }

  if (searchParams.q) {
    query = query.or(
      `title.ilike.%${searchParams.q}%,ref_code.ilike.%${searchParams.q}%`
    )
  }

  const { data, count } = await query

  return (
    <AdminContractsClient
      contracts={(data ?? []) as unknown as Array<{
        id: string
        ref_code: string
        title: string
        state: string
        currency: string
        total_value: number
        created_at: string
        initiator: { full_name: string; email: string } | null
      }>}
      total={count ?? 0}
      page={page}
      limit={limit}
      stateFilter={searchParams.state}
      query={searchParams.q}
    />
  )
}
