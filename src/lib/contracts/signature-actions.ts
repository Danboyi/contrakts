'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { insertNotifications } from '@/lib/notifications/store'
import { getCounterpartyRole } from '@/lib/types/negotiation'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Milestone } from '@/types'

export type SignatureResult = {
  error?: string
  success?: boolean
  contractId?: string
}

const NewUserSignSchema = z.object({
  token: z.string().min(1),
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const ExistingUserSignSchema = z.object({
  token: z.string().min(1),
  email: z.string().email('Enter a valid email'),
  password: z.string().optional(),
})

type InviteContractRecord = {
  id: string
  state: string
  title: string
  ref_code: string
  description: string | null
  currency: string
  total_value: number
  terms: string | null
  created_at: string
  initiator_id: string
  counterparty_id: string | null
  initiator_role: 'service_provider' | 'service_receiver'
  service_provider_id: string | null
  service_receiver_id: string | null
  signed_counterparty_at: string | null
  initiator:
    | {
        id: string
        email: string
        full_name: string
      }
    | Array<{
        id: string
        email: string
        full_name: string
      }>
    | null
  milestones:
    | Array<{
        title: string
        description: string | null
        amount: number
        deadline: string | null
      }>
    | null
}

function normalizeInviteContract(contract: InviteContractRecord) {
  const initiator = Array.isArray(contract.initiator)
    ? (contract.initiator[0] ?? null)
    : contract.initiator

  return {
    ...contract,
    initiator,
    milestones: (contract.milestones ?? []) as Array<
      Pick<Milestone, 'title' | 'description' | 'amount' | 'deadline'>
    >,
  }
}

async function getInviteContract(token: string) {
  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from('contracts')
    .select(
      `
      id,
      state,
      title,
      ref_code,
      description,
      currency,
      total_value,
      terms,
      created_at,
      initiator_id,
      counterparty_id,
      initiator_role,
      service_provider_id,
      service_receiver_id,
      signed_counterparty_at,
      initiator:users!initiator_id(id, email, full_name),
      milestones(title, description, amount, deadline)
    `
    )
    .eq('invite_token', token)
    .single()

  return data ? normalizeInviteContract(data as unknown as InviteContractRecord) : null
}

async function finalizeInviteAcceptance(params: {
  contract: ReturnType<typeof normalizeInviteContract>
  userId: string
  fullName: string
  email: string
  acceptedVia: 'invite_new_user' | 'invite_existing_user' | 'invite_existing_session'
}) {
  const supabaseAdmin = createAdminClient()
  const now = new Date().toISOString()

  const { contract, userId, fullName, email, acceptedVia } = params

  if (contract.signed_counterparty_at) {
    return { error: 'This contract has already been signed.' }
  }

  if (contract.counterparty_id && contract.counterparty_id !== userId) {
    return {
      error:
        'This invite is already assigned to another account. Use the invited account to sign.',
    }
  }

  if (contract.initiator_id === userId) {
    return { error: 'You cannot accept your own contract invite.' }
  }

  const isCreatorProvider = contract.initiator_role === 'service_provider'

  const { error: updateError } = await supabaseAdmin
    .from('contracts')
    .update({
      counterparty_id: userId,
      service_provider_id: isCreatorProvider ? contract.initiator_id : userId,
      service_receiver_id: isCreatorProvider ? userId : contract.initiator_id,
      current_reviewer_id: userId,
      negotiation_status: 'pending_review',
      state: 'pending_review',
    })
    .eq('id', contract.id)

  if (updateError) {
    return { error: 'Could not accept the invite. Please try again.' }
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contract.id,
    actor_id: userId,
    event_type: 'contract.invite_accepted',
    payload: {
      role: getCounterpartyRole(contract.initiator_role),
      accepted_via: acceptedVia,
    },
  })

  await notifyContractEvent(contract.id, 'contract.invite_accepted', {
    role: getCounterpartyRole(contract.initiator_role),
    accepted_via: acceptedVia,
  }).catch(console.error)

  await insertNotifications({
    user_id: contract.initiator_id,
    contract_id: contract.id,
    type: 'counterparty_joined',
    title: 'Counterparty joined',
    body: `${fullName} accepted the invite for "${contract.title}" and can now review the terms.`,
  })

  revalidatePath(`/contracts/${contract.id}`)
  revalidatePath('/contracts')
  revalidatePath('/dashboard')

  return { success: true, contractId: contract.id }
}

export async function signAsNewUser(
  input: z.infer<typeof NewUserSignSchema>
): Promise<SignatureResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return {
      error:
        'Signature flow is not configured yet. Add your Supabase credentials to continue.',
    }
  }

  const parsed = NewUserSignSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const { token, full_name, email, password } = parsed.data

  const contract = await getInviteContract(token)
  if (!contract) {
    return { error: 'This invite link is invalid or has expired.' }
  }
  if (!['draft', 'pending', 'pending_review', 'countered'].includes(contract.state)) {
    return { error: 'This contract is no longer accepting reviews.' }
  }
  if (contract.signed_counterparty_at) {
    return { error: 'This contract has already been signed.' }
  }
  if (contract.counterparty_id) {
    return {
      error: 'An account is already attached to this invite. Sign in instead.',
    }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: existingProfile } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return {
      error: 'An account with this email already exists. Sign in instead.',
    }
  }

  const { data: authData, error: signUpError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

  if (signUpError || !authData.user) {
    return { error: signUpError?.message ?? 'Account creation failed.' }
  }

  const userId = authData.user.id

  await supabaseAdmin.from('users').upsert({
    id: userId,
    full_name,
    email,
  })

  const finalizeResult = await finalizeInviteAcceptance({
    contract,
    userId,
    fullName: full_name,
    email,
    acceptedVia: 'invite_new_user',
  })

  if (finalizeResult.error) {
    return finalizeResult
  }

  await supabase.auth.signInWithPassword({ email, password })

  return finalizeResult
}

export async function signAsExistingUser(
  input: z.infer<typeof ExistingUserSignSchema>
): Promise<SignatureResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return {
      error:
        'Signature flow is not configured yet. Add your Supabase credentials to continue.',
    }
  }

  const parsed = ExistingUserSignSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const { token, email, password } = parsed.data
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  let {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (!password) {
      return { error: 'Enter your password.' }
    }

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !authData.user) {
      return { error: 'Incorrect email or password.' }
    }

    user = authData.user
  }

  if (!user.email || user.email.toLowerCase() !== email.trim().toLowerCase()) {
    return { error: 'You are signed in as a different account.' }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found.' }
  }

  const contract = await getInviteContract(token)
  if (!contract) {
    return { error: 'Invalid invite link.' }
  }
  if (!['draft', 'pending', 'pending_review', 'countered'].includes(contract.state)) {
    return { error: 'This contract is no longer accepting reviews.' }
  }
  if (contract.initiator_id === user.id) {
    return { error: 'You cannot sign your own contract as counterparty.' }
  }

  return finalizeInviteAcceptance({
    contract,
    userId: user.id,
    fullName: profile.full_name,
    email: profile.email,
    acceptedVia: password ? 'invite_existing_user' : 'invite_existing_session',
  })
}
