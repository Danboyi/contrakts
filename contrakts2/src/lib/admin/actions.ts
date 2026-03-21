'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminActionResult = {
  error?: string
  success?: boolean
}

const FraudFlagSchema = z
  .object({
    userId: z.string().uuid().optional(),
    contractId: z.string().uuid().optional(),
    reason: z.string().trim().min(10, 'Add a reason for the fraud flag.'),
    severity: z.enum(['low', 'medium', 'high']).default('medium'),
    notes: z.string().trim().optional(),
  })
  .refine(
    (value) => Boolean(value.userId || value.contractId),
    'A user or contract must be selected.'
  )

export async function createFraudFlag(
  input: z.infer<typeof FraudFlagSchema>
): Promise<AdminActionResult> {
  const admin = await requireAdmin('admin')
  const parsed = FraudFlagSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid fraud flag input.',
    }
  }

  const supabaseAdmin = createAdminClient()
  const { userId, contractId, reason, severity, notes } = parsed.data

  const { error } = await supabaseAdmin.from('fraud_flags').insert({
    user_id: userId ?? null,
    contract_id: contractId ?? null,
    flagged_by: admin.id,
    reason,
    severity,
    notes: notes?.trim() ? notes.trim() : null,
  })

  if (error) {
    return { error: error.message }
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contractId ?? null,
    actor_id: admin.id,
    event_type: 'fraud.flagged',
    payload: {
      user_id: userId ?? null,
      contract_id: contractId ?? null,
      severity,
      reason,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/contracts')
  revalidatePath('/admin/audit')

  return { success: true }
}
