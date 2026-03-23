import { redirect } from 'next/navigation'
import { SigningFlow } from '@/components/contracts'
import { createClient } from '@/lib/supabase/server'
import {
  getOtherPartyId,
  getUserRole,
  type NegotiationContract,
} from '@/lib/types/negotiation'
import type { Contract, Milestone, User } from '@/types'

type SigningContract = Contract
type SigningUser = Pick<User, 'id' | 'full_name' | 'email'>

export const metadata = { title: 'Sign contract' }

export default async function ContractSignPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: contractData } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  const contract = contractData as SigningContract | null

  if (!contract) {
    redirect('/contracts')
  }

  const userRole = getUserRole(
    contract as unknown as NegotiationContract,
    user.id
  )

  if (!userRole) {
    redirect('/contracts')
  }

  if (!['accepted', 'signing'].includes(contract.state)) {
    redirect(`/contracts/${params.id}`)
  }

  const alreadySigned =
    (userRole === 'service_receiver' &&
      (contract.signed_by_receiver || Boolean(contract.receiver_signed_at))) ||
    (userRole === 'service_provider' &&
      (contract.signed_by_provider || Boolean(contract.provider_signed_at)))

  if (alreadySigned) {
    redirect(`/contracts/${params.id}`)
  }

  if (
    userRole === 'service_provider' &&
    !(contract.signed_by_receiver || Boolean(contract.receiver_signed_at))
  ) {
    redirect(`/contracts/${params.id}`)
  }

  const { data: milestoneData } = await supabase
    .from('milestones')
    .select('*')
    .eq('contract_id', params.id)
    .order('order_index')

  const otherPartyId = getOtherPartyId(
    contract as unknown as NegotiationContract,
    user.id
  )

  let otherParty: SigningUser | null = null
  if (otherPartyId) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', otherPartyId)
      .single()

    otherParty = (data as SigningUser | null) ?? null
  }

  const { data: currentUserData } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

  const currentUser = (currentUserData as SigningUser | null) ?? {
    id: user.id,
    full_name: user.user_metadata.full_name ?? user.email ?? 'Contrakts user',
    email: user.email ?? '',
  }

  return (
    <SigningFlow
      contract={contract}
      milestones={(milestoneData ?? []) as Milestone[]}
      currentUser={currentUser}
      otherParty={otherParty}
      userRole={userRole}
    />
  )
}
