'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from './keys'
import type { ApiScope } from './keys'

export type KeyActionResult = {
  error?: string
  success?: boolean
  key?: string
  keyId?: string
}

export async function createApiKey(
  name: string,
  scopes: ApiScope[]
): Promise<KeyActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  if (!isSupabaseAdminConfigured()) {
    return { error: 'API keys are not configured yet.' }
  }

  if (!name.trim() || name.trim().length < 3) {
    return { error: 'Key name must be at least 3 characters.' }
  }

  if (scopes.length === 0) {
    return { error: 'Select at least one scope.' }
  }

  const supabaseAdmin = createAdminClient()
  const { count } = await supabaseAdmin
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if ((count ?? 0) >= 10) {
    return { error: 'Maximum 10 active API keys allowed.' }
  }

  const { raw, hash, prefix } = generateApiKey()

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name.trim(),
      key_hash: hash,
      key_prefix: prefix,
      scopes,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'Failed to create API key.' }
  }

  revalidatePath('/settings')

  return {
    success: true,
    key: raw,
    keyId: data.id,
  }
}

export async function revokeApiKey(keyId: string): Promise<KeyActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  if (!isSupabaseAdminConfigured()) {
    return { error: 'API keys are not configured yet.' }
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')

  return { success: true }
}
