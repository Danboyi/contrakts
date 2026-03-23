import { redirect } from 'next/navigation'
import { ReviewEditor } from '@/components/contracts/review-editor'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  ContractReview,
  MilestoneSnapshot,
  NegotiationContract,
} from '@/lib/types/negotiation'
import {
  getOtherPartyId,
  getUserRole,
  isUsersTurn,
} from '@/lib/types/negotiation'
import type { Contract, Milestone } from '@/types'

type ReviewRow = ContractReview & {
  reviewer?: { full_name: string | null; email: string | null } | null
}

function normalizeReviewRow(review: Record<string, unknown>): ReviewRow {
  const reviewerValue = review.reviewer as
    | { full_name: string | null; email: string | null }
    | Array<{ full_name: string | null; email: string | null }>
    | null

  return {
    id: String(review.id),
    contract_id: String(review.contract_id),
    reviewer_id: String(review.reviewer_id),
    reviewer_role: review.reviewer_role as ReviewRow['reviewer_role'],
    round: Number(review.round ?? 0),
    action: review.action as ReviewRow['action'],
    terms_snapshot:
      (review.terms_snapshot as Record<string, unknown> | null) ?? {},
    milestones_snapshot: Array.isArray(review.milestones_snapshot)
      ? (review.milestones_snapshot as MilestoneSnapshot[])
      : [],
    changes_summary: Array.isArray(review.changes_summary)
      ? review.changes_summary.map((value) => String(value))
      : [],
    message: typeof review.message === 'string' ? review.message : null,
    created_at: String(review.created_at),
    reviewer: Array.isArray(reviewerValue)
      ? (reviewerValue[0] ?? null)
      : (reviewerValue ?? null),
  }
}

export default async function ContractReviewPage({
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

  const supabaseAdmin = createAdminClient()
  const { data: contractData } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .single()

  const contract = contractData as Contract | null

  if (!contract) {
    redirect('/contracts')
  }

  const userRole = getUserRole(contract as unknown as NegotiationContract, user.id)

  if (!userRole) {
    redirect('/contracts')
  }

  if (
    [
      'accepted',
      'signing',
      'signed',
      'funding',
      'funded',
      'active',
      'complete',
      'completed',
      'cancelled',
      'voided',
      'disputed',
      'expired',
    ].includes(contract.state)
  ) {
    redirect(`/contracts/${params.id}`)
  }

  const { data: milestoneData } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('contract_id', params.id)
    .order('order_index')

  const { data: reviewData } = await supabaseAdmin
    .from('contract_reviews')
    .select('*, reviewer:users!reviewer_id(full_name,email)')
    .eq('contract_id', params.id)
    .order('round', { ascending: true })

  const otherPartyId = getOtherPartyId(
    contract as unknown as NegotiationContract,
    user.id
  )

  let otherParty: { id: string; full_name: string | null; email: string | null } | null =
    null

  if (otherPartyId) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('id', otherPartyId)
      .single()

    otherParty = data
  }

  const canEdit =
    isUsersTurn(contract as unknown as NegotiationContract, user.id) &&
    ['pending_review', 'countered'].includes(contract.negotiation_status)

  return (
    <ReviewEditor
      contract={contract}
      milestones={(milestoneData ?? []) as Milestone[]}
      reviews={(reviewData ?? []).map((review) =>
        normalizeReviewRow(review as Record<string, unknown>)
      )}
      currentUserId={user.id}
      userRole={userRole}
      otherParty={otherParty}
      canEdit={canEdit}
    />
  )
}
