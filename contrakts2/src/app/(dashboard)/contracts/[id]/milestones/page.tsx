import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MilestonePageClient } from './milestone-page-client'
import type { Contract, Milestone } from '@/types'

type MilestoneDetailContract = Contract & {
  initiator: NonNullable<Contract['initiator']> | null
  counterparty: NonNullable<Contract['counterparty']> | null
  milestones: Milestone[]
}

export const metadata = { title: 'Milestones' }

export default async function MilestonesPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { action?: string; id?: string }
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
      initiator:users!initiator_id(id, full_name, email, avatar_url),
      counterparty:users!counterparty_id(id, full_name, email, avatar_url),
      milestones(
        *,
        deliverables(*)
      )
    `
    )
    .eq('id', params.id)
    .single()

  const contract = contractData as MilestoneDetailContract | null

  if (!contract) {
    notFound()
  }

  const isParty =
    contract.initiator_id === user.id || contract.counterparty_id === user.id

  if (!isParty) {
    notFound()
  }

  const milestones = [...(contract.milestones ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  return (
    <MilestonePageClient
      contract={{ ...contract, milestones }}
      currentUserId={user.id}
      initialAction={searchParams.action}
      initialMilestoneId={searchParams.id}
    />
  )
}
