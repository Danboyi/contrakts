import type { User } from './user'

export type ContractState =
  | 'draft'
  | 'pending'
  | 'pending_review'
  | 'funded'
  | 'active'
  | 'in_review'
  | 'countered'
  | 'accepted'
  | 'signing'
  | 'signed'
  | 'funding'
  | 'disputed'
  | 'complete'
  | 'completed'
  | 'voided'
  | 'cancelled'
  | 'expired'

export type PartyRole = 'service_provider' | 'service_receiver'

export type ContractNegotiationStatus =
  | 'draft'
  | 'pending_review'
  | 'in_review'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type MilestoneState =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'disputed'
  | 'approved'
  | 'paid'

export type Industry =
  | 'creative'
  | 'construction'
  | 'consulting'
  | 'logistics'
  | 'software'
  | 'events'
  | 'supply'
  | 'other'

export type ContractPaymentMethod = 'fiat' | 'crypto'

export interface Contract {
  id: string
  ref_code: string
  title: string
  description: string | null
  initiator_id: string
  counterparty_id: string | null
  invite_token: string | null
  industry: Industry
  state: ContractState
  payment_method: ContractPaymentMethod
  initiator_role: PartyRole
  service_provider_id: string | null
  service_receiver_id: string | null
  negotiation_status: ContractNegotiationStatus
  current_reviewer_id: string | null
  review_round: number
  terms_locked: boolean
  currency: string
  total_value: number
  platform_fee_pct: number
  platform_fee: number | null
  start_date: string | null
  end_date: string | null
  terms: string | null
  last_reviewed_at: string | null
  accepted_at: string | null
  signed_initiator_at: string | null
  signed_counterparty_at: string | null
  signed_by_receiver: boolean
  signed_by_provider: boolean
  receiver_signed_at: string | null
  provider_signed_at: string | null
  receiver_signature: string | null
  provider_signature: string | null
  funded_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  initiator?: User
  counterparty?: User
  milestones?: Milestone[]
}

export interface Milestone {
  id: string
  contract_id: string
  order_index: number
  title: string
  description: string | null
  amount: number
  state: MilestoneState
  deadline: string | null
  submitted_at: string | null
  approved_at: string | null
  paid_at: string | null
  auto_released: boolean
  is_locked: boolean
  last_edited_by: string | null
  last_edited_at: string | null
  deliverables?: Deliverable[]
}

export interface Deliverable {
  id: string
  milestone_id: string
  submitted_by: string
  file_url: string | null
  file_name: string | null
  file_type: string | null
  note: string | null
  created_at: string
  submission_id: string | null
  sort_order: number
}
