'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { paystackCreateRecipient } from '@/lib/paystack/client'
import { createClient } from '@/lib/supabase/server'
import { syncTrustScore } from './trust'

export type ProfileActionResult = {
  error?: string
  success?: boolean
}

const UpdateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().max(32, 'Phone number is too long').optional(),
})

const BankSchema = z.object({
  account_number: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),
  bank_code: z.string().trim().min(3, 'Select a bank'),
  bank_name: z.string().trim().min(2, 'Enter bank name'),
  account_name: z.string().trim().min(2, 'Enter account name'),
})

function revalidateProfilePaths(userId: string) {
  revalidatePath('/profile')
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath(`/u/${userId}`)
}

export async function updateProfile(
  input: z.infer<typeof UpdateProfileSchema>
): Promise<ProfileActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid profile input.' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateProfilePaths(user.id)
  return { success: true }
}

export async function updateAvatar(filePath: string): Promise<ProfileActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  if (!filePath.startsWith(`${user.id}/`)) {
    return { error: 'Invalid avatar path.' }
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateProfilePaths(user.id)
  return { success: true }
}

export async function setupBankAccount(
  input: z.infer<typeof BankSchema>
): Promise<ProfileActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const parsed = BankSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid bank details.' }
  }

  const { account_number, bank_code, bank_name, account_name } = parsed.data

  try {
    const recipient = await paystackCreateRecipient({
      type: 'nuban',
      name: account_name,
      account_number,
      bank_code,
      currency: 'NGN',
    })

    const { error } = await supabase
      .from('users')
      .update({
        bank_account_number: account_number,
        bank_code,
        bank_name,
        paystack_recipient_code: recipient.recipient_code,
        preferred_payout: 'fiat',
      })
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    revalidateProfilePaths(user.id)
    return { success: true }
  } catch (errorValue) {
    return {
      error:
        errorValue instanceof Error
          ? errorValue.message
          : 'Bank account setup failed.',
    }
  }
}

export async function saveWalletAddress(address: string): Promise<ProfileActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const trimmed = address.trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return { error: 'Enter a valid EVM wallet address (0x...).' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      wallet_address: trimmed,
      preferred_payout: 'crypto',
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateProfilePaths(user.id)
  return { success: true }
}

export async function getTrustBreakdown(userId: string) {
  return syncTrustScore(userId)
}
