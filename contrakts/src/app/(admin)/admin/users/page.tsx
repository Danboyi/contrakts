import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersClient } from './admin-users-client'

export const metadata = { title: 'Users - Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; kyc?: string; page?: string }
}) {
  await requireAdmin('admin')

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10))
  const limit = 25
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabaseAdmin = createAdminClient()
  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.q) {
    query = query.or(
      `full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`
    )
  }

  if (searchParams.kyc) {
    query = query.eq('kyc_status', searchParams.kyc)
  }

  const { data, count } = await query

  return (
    <AdminUsersClient
      users={(data ?? []).map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        kyc_status: user.kyc_status,
        trust_score: user.trust_score,
        total_contracts: user.total_contracts,
        created_at: user.created_at,
      }))}
      total={count ?? 0}
      page={page}
      limit={limit}
      query={searchParams.q}
      kycFilter={searchParams.kyc}
    />
  )
}
