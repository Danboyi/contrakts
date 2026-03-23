export type PartyRole = 'service_provider' | 'service_receiver'

export type NegotiationStatus =
  | 'draft'
  | 'pending_review'
  | 'in_review'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type ContractStatus =
  | 'draft'
  | 'pending'
  | 'pending_review'
  | 'in_review'
  | 'countered'
  | 'accepted'
  | 'signing'
  | 'signed'
  | 'funding'
  | 'funded'
  | 'active'
  | 'complete'
  | 'completed'
  | 'disputed'
  | 'voided'
  | 'cancelled'
  | 'expired'

export type ReviewAction =
  | 'initial_draft'
  | 'review_edit'
  | 'counter_offer'
  | 'accept'
  | 'reject'

export interface MilestoneSnapshot {
  id?: string
  title: string
  description: string
  amount: number
  due_date: string | null
  order: number
}

export interface ContractReview {
  id: string
  contract_id: string
  reviewer_id: string
  reviewer_role: PartyRole
  round: number
  action: ReviewAction
  terms_snapshot: Record<string, unknown>
  milestones_snapshot: MilestoneSnapshot[]
  changes_summary: string[]
  message: string | null
  created_at: string
}

export interface MilestoneEdit {
  id: string
  review_id: string
  milestone_id: string | null
  field_name: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface NegotiationContract {
  id: string
  title: string
  description: string
  initiator_id: string
  counterparty_id: string | null
  service_provider_id: string | null
  service_receiver_id: string | null
  initiator_role: PartyRole
  state: ContractStatus
  negotiation_status: NegotiationStatus
  current_reviewer_id: string | null
  review_round: number
  terms_locked: boolean
  total_value: number
  currency: string
  last_reviewed_at: string | null
  accepted_at: string | null
  signed_by_receiver: boolean
  signed_by_provider: boolean
  receiver_signed_at: string | null
  provider_signed_at: string | null
  receiver_signature: string | null
  provider_signature: string | null
  created_at: string
  updated_at: string
}

function getRoleFromLegacyAssignments(
  contract: NegotiationContract,
  userId: string
): PartyRole | null {
  if (contract.initiator_id === userId) {
    return contract.initiator_role
  }

  if (contract.counterparty_id === userId) {
    return getCounterpartyRole(contract.initiator_role)
  }

  return null
}

export function getUserRole(
  contract: NegotiationContract,
  userId: string
): PartyRole | null {
  if (contract.service_receiver_id === userId) return 'service_receiver'
  if (contract.service_provider_id === userId) return 'service_provider'

  return getRoleFromLegacyAssignments(contract, userId)
}

export function isUsersTurn(
  contract: NegotiationContract,
  userId: string
): boolean {
  return contract.current_reviewer_id === userId
}

export function getOtherPartyId(
  contract: NegotiationContract,
  userId: string
): string | null {
  if (contract.service_receiver_id === userId) {
    return contract.service_provider_id
  }
  if (contract.service_provider_id === userId) {
    return contract.service_receiver_id
  }

  if (contract.initiator_id === userId) {
    return contract.counterparty_id
  }

  if (contract.counterparty_id === userId) {
    return contract.initiator_id
  }

  return null
}

export const ROLE_LABELS: Record<PartyRole, string> = {
  service_provider: 'Service Provider',
  service_receiver: 'Service Receiver',
}

export function getCounterpartyRole(role: PartyRole): PartyRole {
  return role === 'service_provider'
    ? 'service_receiver'
    : 'service_provider'
}

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  pending_review: 'Pending Review',
  in_review: 'In Review',
  countered: 'Counter-Offered',
  accepted: 'Accepted',
  signing: 'Awaiting Signatures',
  signed: 'Signed',
  funding: 'Awaiting Funding',
  funded: 'Funded',
  active: 'Active',
  complete: 'Completed',
  completed: 'Completed',
  disputed: 'Disputed',
  voided: 'Voided',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export const NEGOTIATION_STATUS_COLORS: Record<NegotiationStatus, string> = {
  draft: 'text-[hsl(var(--color-text-3))]',
  pending_review: 'text-[hsl(var(--color-warning))]',
  in_review: 'text-[hsl(var(--color-accent))]',
  countered: 'text-[hsl(var(--color-warning))]',
  accepted: 'text-[hsl(var(--color-success))]',
  rejected: 'text-[hsl(var(--color-danger))]',
  expired: 'text-[hsl(var(--color-text-3))]',
}
