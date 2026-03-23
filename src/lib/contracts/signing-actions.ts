'use server'

import { revalidatePath } from 'next/cache'
import { notifyContractEvent } from '@/lib/api/webhooks'
import { insertNotifications } from '@/lib/notifications/store'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  getUserRole,
  type NegotiationContract,
  type PartyRole,
} from '@/lib/types/negotiation'

type SignContractParams = {
  contractId: string
  userId: string
  userRole: PartyRole
  signature: string
}

type SignContractResult = {
  success: true
  bothSigned: boolean
}

export async function signContract({
  contractId,
  userId,
  userRole,
  signature,
}: SignContractParams): Promise<SignContractResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error('Not authenticated.')
  }

  const trimmedSignature = signature.trim()
  if (trimmedSignature.length < 2) {
    throw new Error('Enter your full name to sign.')
  }

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (!contract) {
    throw new Error('Contract not found.')
  }

  if (!['accepted', 'signing'].includes(contract.state)) {
    throw new Error('Contract is not ready for signing.')
  }

  if (!contract.terms_locked) {
    throw new Error('Terms must be locked before signing.')
  }

  const resolvedRole = getUserRole(
    contract as unknown as NegotiationContract,
    user.id
  )

  if (!resolvedRole || resolvedRole !== userRole) {
    throw new Error('You are not assigned a signing role on this contract.')
  }

  const isReceiver = resolvedRole === 'service_receiver'
  const isProvider = resolvedRole === 'service_provider'
  const receiverSigned = contract.signed_by_receiver || Boolean(contract.receiver_signed_at)
  const providerSigned = contract.signed_by_provider || Boolean(contract.provider_signed_at)

  if (isProvider && !receiverSigned) {
    throw new Error('The service receiver must sign before the service provider.')
  }

  if (isReceiver && receiverSigned) {
    throw new Error('You have already signed this contract.')
  }

  if (isProvider && providerSigned) {
    throw new Error('You have already signed this contract.')
  }

  const now = new Date().toISOString()
  const updates: Record<string, string | boolean | null> = {
    updated_at: now,
  }

  if (isReceiver) {
    updates.signed_by_receiver = true
    updates.receiver_signed_at = now
    updates.receiver_signature = trimmedSignature
    updates.state = 'signing'
  }

  if (isProvider) {
    updates.signed_by_provider = true
    updates.provider_signed_at = now
    updates.provider_signature = trimmedSignature
    updates.state = 'signed'
  }

  if (contract.initiator_id === user.id && !contract.signed_initiator_at) {
    updates.signed_initiator_at = now
  }

  if (contract.counterparty_id === user.id && !contract.signed_counterparty_at) {
    updates.signed_counterparty_at = now
  }

  const { error: updateError } = await supabaseAdmin
    .from('contracts')
    .update(updates)
    .eq('id', contractId)

  if (updateError) {
    throw new Error('Failed to sign contract. Please try again.')
  }

  await supabaseAdmin.from('audit_log').insert({
    contract_id: contractId,
    actor_id: user.id,
    event_type: 'contract.signed',
    payload: {
      role: resolvedRole,
      signature: trimmedSignature,
      state: updates.state,
    },
  })

  const otherPartyId =
    resolvedRole === 'service_receiver'
      ? contract.service_provider_id ?? contract.counterparty_id
      : contract.service_receiver_id ?? contract.initiator_id

  if (isReceiver && otherPartyId) {
    await insertNotifications({
      user_id: otherPartyId,
      contract_id: contractId,
      type: 'signature_requested',
      title: 'Your turn to sign',
      body: `The service receiver signed "${contract.title}". Review the final terms and counter-sign to continue.`,
    })
  }

  if (isProvider) {
    const serviceReceiverId =
      contract.service_receiver_id ??
      (contract.initiator_role === 'service_receiver'
        ? contract.initiator_id
        : contract.counterparty_id)

    if (serviceReceiverId) {
      await insertNotifications({
        user_id: serviceReceiverId,
        contract_id: contractId,
        type: 'contract_fully_signed',
        title: 'Contract fully signed',
        body: `Both parties have signed "${contract.title}". Fund the escrow to begin work.`,
      })
    }
  }

  await notifyContractEvent(contractId, 'contract.signed', {
    role: resolvedRole,
    state: updates.state,
  }).catch(console.error)

  revalidatePath(`/contracts/${contractId}`)
  revalidatePath(`/contracts/${contractId}/sign`)
  revalidatePath('/contracts')

  return { success: true, bothSigned: isProvider }
}
