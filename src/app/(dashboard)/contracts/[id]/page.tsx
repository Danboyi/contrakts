import { notFound, redirect } from 'next/navigation'
import { ContractDetailClient } from './contract-detail-client'
import { createClient } from '@/lib/supabase/server'
import type { Contract, Milestone } from '@/types'

type DetailContract = Contract & {
  initiator: NonNullable<Contract['initiator']> | null
  counterparty: NonNullable<Contract['counterparty']> | null
  milestones: Milestone[]
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contracts')
    .select('title, ref_code')
    .eq('id', params.id)
    .single()

  return {
    title: data ? `${data.ref_code} - ${data.title}` : 'Contract',
  }
}

export default async function ContractDetailPage({
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
    .select(
      `
      *,
      initiator:users!initiator_id(*),
      counterparty:users!counterparty_id(*),
      milestones(
        *,
        deliverables(*)
      )
    `
    )
    .eq('id', params.id)
    .single()

  const contract = contractData as unknown as DetailContract | null

  if (!contract) {
    notFound()
  }

  const isParty =
    contract.initiator_id === user.id || contract.counterparty_id === user.id

  if (!isParty) {
    notFound()
  }

  const sortedMilestones = [...(contract.milestones ?? [])].sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  )

  return (
    <ContractDetailClient
      initialContract={{ ...contract, milestones: sortedMilestones }}
      currentUserId={user.id}
    />
  )
}
