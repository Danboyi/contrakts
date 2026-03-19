import { redirect } from 'next/navigation'
import { InvitePageClient } from './invite-page-client'
import { InvalidInvite } from './invalid-invite'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Contract, Milestone, User } from '@/types'

type InvitePageContract = Pick<
  Contract,
  | 'id'
  | 'ref_code'
  | 'title'
  | 'description'
  | 'industry'
  | 'total_value'
  | 'currency'
  | 'state'
  | 'terms'
  | 'created_at'
  | 'start_date'
  | 'end_date'
  | 'signed_initiator_at'
  | 'invite_token'
  | 'counterparty_id'
  | 'signed_counterparty_at'
> & {
  initiator: User | null
  milestones: Array<
    Pick<Milestone, 'id' | 'order_index' | 'title' | 'description' | 'amount' | 'deadline'>
  >
}

export const metadata = {
  title: 'Contract invite',
}

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return <InvalidInvite reason="not_found" />
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: contractData } = await supabaseAdmin
    .from('contracts')
    .select(
      `
      id,
      ref_code,
      title,
      description,
      industry,
      total_value,
      currency,
      state,
      terms,
      created_at,
      start_date,
      end_date,
      signed_initiator_at,
      invite_token,
      counterparty_id,
      signed_counterparty_at,
      initiator:users!initiator_id(*),
      milestones(
        id,
        order_index,
        title,
        description,
        amount,
        deadline
      )
    `
    )
    .eq('invite_token', params.token)
    .single()

  if (!contractData) {
    return <InvalidInvite reason="not_found" />
  }

  const rawContract = contractData as unknown as {
    initiator?: User | User[] | null
    milestones?: InvitePageContract['milestones']
  } & Omit<InvitePageContract, 'initiator' | 'milestones'>

  const contract: InvitePageContract = {
    ...rawContract,
    initiator: Array.isArray(rawContract.initiator)
      ? (rawContract.initiator[0] ?? null)
      : (rawContract.initiator ?? null),
    milestones: [...(rawContract.milestones ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    ),
  }

  if (['complete', 'voided'].includes(contract.state)) {
    return <InvalidInvite reason="closed" />
  }

  if (contract.signed_counterparty_at) {
    const {
      data: { user: signedUser },
    } = await supabase.auth.getUser()

    if (signedUser) {
      if (
        contract.initiator?.id === signedUser.id ||
        contract.counterparty_id === signedUser.id
      ) {
        redirect(`/contracts/${contract.id}`)
      }
    }

    return <InvalidInvite reason="signed" />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUser: User | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    currentUser = (profile as User | null) ?? null

    if (contract.initiator?.id === user.id) {
      redirect(`/contracts/${contract.id}`)
    }

    if (
      contract.counterparty_id === user.id &&
      contract.signed_counterparty_at
    ) {
      redirect(`/contracts/${contract.id}`)
    }

    if (contract.counterparty_id && contract.counterparty_id !== user.id) {
      return <InvalidInvite reason="reserved" />
    }
  }

  return (
    <InvitePageClient
      contract={contract}
      token={params.token}
      currentUser={currentUser}
    />
  )
}
