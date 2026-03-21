import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'arbitrator' | 'admin' | 'superadmin'

export interface AdminUser {
  id: string
  role: AdminRole
  profile: {
    full_name: string
    email: string
    avatar_url: string | null
  }
}

const ROLE_HIERARCHY: AdminRole[] = ['arbitrator', 'admin', 'superadmin']

export function hasAdminRole(
  currentRole: AdminRole,
  minRole: AdminRole
) {
  return ROLE_HIERARCHY.indexOf(currentRole) >= ROLE_HIERARCHY.indexOf(minRole)
}

export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  if (!isSupabaseAdminConfigured()) {
    return null
  }

  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  return (data?.role as AdminRole | undefined) ?? null
}

export async function requireAdmin(
  minRole: AdminRole = 'arbitrator'
): Promise<AdminUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = await getAdminRole(user.id)
  if (!role || !hasAdminRole(role, minRole)) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    role,
    profile: profile ?? {
      full_name: 'Admin',
      email: user.email ?? '',
      avatar_url: null,
    },
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  return Boolean(await getAdminRole(userId))
}
