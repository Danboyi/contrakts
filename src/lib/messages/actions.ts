'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { insertNotifications } from '@/lib/notifications/store'
import { createClient } from '@/lib/supabase/server'
import type { MessageType } from '@/types'

type ContractPartyRecord = {
  id: string
  title: string
  initiator_id: string
  counterparty_id: string | null
  service_provider_id: string | null
  service_receiver_id: string | null
}

type MessageRecord = {
  id: string
  contract_id: string
  sender_id: string
  attachment_url: string | null
}

function isContractParty(contract: ContractPartyRecord, userId: string) {
  return (
    contract.initiator_id === userId ||
    contract.counterparty_id === userId ||
    contract.service_provider_id === userId ||
    contract.service_receiver_id === userId
  )
}

function getRecipientId(contract: ContractPartyRecord, senderId: string): string | null {
  if (contract.service_provider_id === senderId) {
    return contract.service_receiver_id
  }

  if (contract.service_receiver_id === senderId) {
    return contract.service_provider_id
  }

  if (contract.initiator_id === senderId) {
    return contract.counterparty_id
  }

  if (contract.counterparty_id === senderId) {
    return contract.initiator_id
  }

  return null
}

async function getAuthorizedContract(
  contractId: string,
  userId: string
): Promise<ContractPartyRecord> {
  const supabase = await createClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      'id, title, initiator_id, counterparty_id, service_provider_id, service_receiver_id'
    )
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    throw new Error('Contract not found')
  }

  const typedContract = contract as ContractPartyRecord

  if (!isContractParty(typedContract, userId)) {
    throw new Error('Not authorized')
  }

  return typedContract
}

export async function sendMessage(params: {
  contractId: string
  body: string
  messageType?: MessageType
  milestoneId?: string
  deliverableId?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
  attachmentSize?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const contract = await getAuthorizedContract(params.contractId, user.id)
  const messageType = params.messageType ?? 'user'
  const trimmedBody = params.body.trim()

  if (!trimmedBody && !params.attachmentUrl) {
    throw new Error('Add a message or attachment before sending')
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      contract_id: params.contractId,
      sender_id: user.id,
      body: trimmedBody,
      message_type: messageType,
      milestone_id: params.milestoneId ?? null,
      deliverable_id: params.deliverableId ?? null,
      attachment_url: params.attachmentUrl ?? null,
      attachment_name: params.attachmentName ?? null,
      attachment_type: params.attachmentType ?? null,
      attachment_size: params.attachmentSize ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (messageType === 'user' || messageType === 'file') {
    const recipientId = getRecipientId(contract, user.id)
    const preview =
      trimmedBody.length > 80 ? `${trimmedBody.slice(0, 80)}…` : trimmedBody || 'Sent an attachment'

    if (recipientId) {
      await insertNotifications({
        user_id: recipientId,
        type: 'message_received',
        title: 'New message',
        body: `Message on "${contract.title}": ${preview}`,
        contract_id: params.contractId,
        read: false,
      })
    }
  }

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)

  return { message, success: true }
}

export async function sendSystemMessage(params: {
  contractId: string
  body: string
  milestoneId?: string
  deliverableId?: string
  messageType?: MessageType
  actorId?: string
}) {
  const admin = createAdminClient()
  const { data: contract } = await admin
    .from('contracts')
    .select('initiator_id')
    .eq('id', params.contractId)
    .single()

  if (!contract || !params.body.trim()) {
    return
  }

  await admin.from('messages').insert({
    contract_id: params.contractId,
    sender_id: params.actorId ?? contract.initiator_id,
    body: params.body.trim(),
    message_type: params.messageType ?? 'system',
    milestone_id: params.milestoneId ?? null,
    deliverable_id: params.deliverableId ?? null,
  })

  revalidatePath(`/contracts/${params.contractId}`)
}

export async function markMessagesRead(params: {
  contractId: string
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await getAuthorizedContract(params.contractId, user.id)

  const { error } = await admin
    .from('messages')
    .update({
      read_by_recipient: true,
      read_at: new Date().toISOString(),
    })
    .eq('contract_id', params.contractId)
    .eq('read_by_recipient', false)
    .neq('sender_id', user.id)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${params.contractId}`)

  return { success: true }
}

export async function deleteMessage(params: {
  messageId: string
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('id, contract_id, sender_id, attachment_url')
    .eq('id', params.messageId)
    .single()

  if (fetchError || !message) {
    throw new Error('Message not found')
  }

  const typedMessage = message as MessageRecord

  if (typedMessage.sender_id !== user.id) {
    throw new Error('Only the sender can delete this message')
  }

  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.messageId)
    .eq('sender_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  if (
    typedMessage.attachment_url &&
    !/^https?:\/\//i.test(typedMessage.attachment_url)
  ) {
    await admin.storage.from('attachments').remove([typedMessage.attachment_url])
  }

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${typedMessage.contract_id}`)

  return { success: true }
}

export async function getUnreadCount(params: {
  contractId: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  await getAuthorizedContract(params.contractId, user.id)

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', params.contractId)
    .eq('read_by_recipient', false)
    .neq('sender_id', user.id)
    .is('deleted_at', null)

  return { count: count ?? 0 }
}
