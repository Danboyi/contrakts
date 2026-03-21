'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  getAppUrl,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config'

const SignUpSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must include at least one number'),
})

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const MagicLinkSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const InviteAcceptSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/\d/, 'Password must include at least one number.'),
})

export type AuthResult = {
  error?: string
  success?: boolean
}

function getFirstIssueMessage(result: {
  success: false
  error: { issues: Array<{ message: string }> }
}) {
  return result.error.issues[0]?.message ?? 'Please review the form and try again.'
}

function getAuthConfigurationError() {
  return {
    error:
      'Authentication is not configured yet. Add your Supabase environment variables to continue.',
  } satisfies AuthResult
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return getAuthConfigurationError()
  }

  const raw = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = SignUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function login(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return getAuthConfigurationError()
  }

  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { error: 'Incorrect email or password. Please try again.' }
    }

    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function sendMagicLink(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return getAuthConfigurationError()
  }

  const parsed = MagicLinkSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function acceptInvite(
  token: string,
  formData: FormData
): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return getAuthConfigurationError()
  }

  const raw = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = InviteAcceptSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed) }
  }

  const supabaseAdmin = createAdminClient()

  const { data: contract, error: contractError } = await supabaseAdmin
    .from('contracts')
    .select('id, state')
    .eq('invite_token', token)
    .eq('state', 'pending')
    .is('counterparty_id', null)
    .single()

  if (contractError || !contract) {
    return { error: 'This invite link is invalid or has already been used.' }
  }

  const supabase = await createClient()
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/contracts/${contract.id}`,
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Account creation failed. Please try again.' }
  }

  const { error: updateError } = await supabaseAdmin
    .from('contracts')
    .update({
      counterparty_id: authData.user.id,
      invite_token: null,
    })
    .eq('id', contract.id)
    .is('counterparty_id', null)

  if (updateError) {
    return {
      error: 'Could not link you to the contract. Contact support.',
    }
  }

  revalidatePath('/', 'layout')
  redirect(`/contracts/${contract.id}`)
}
