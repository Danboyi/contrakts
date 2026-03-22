import type { User } from './user'

export type ContractState =
  | 'draft'
  | 'pending'
  | 'negotiating'
  | 'funded'
  | 'active'
  | 'in_review'
  | 'disputed'
  | 'complete'
  | 'voided'

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

/** The role the initiator chose when creating the contract */
export type InitiatorRole = 'vendor' | 'service_receiver'

/** Negotiation round status */
export type NegotiationStatus =
  | 'pending_review'
  | 'reviewed'
  | 'countered'
  | 'accepted'

export interface NegotiationRound {
  id: string
  contract_id: string
  round_number: number
  submitted_by: string
  status: NegotiationStatus
  changes_summary: string | null
  milestone_changes: Record<string, unknown> | null
  terms_changes: string | null
  created_at: string
  responded_at: string | null
  submitted_by_user?: User
}

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
  initiator_role: InitiatorRole
  payment_method: ContractPaymentMethod
  currency: string
  total_value: number
  platform_fee_pct: number
  platform_fee: number | null
  start_date: string | null
  end_date: string | null
  terms: string | null
  signed_initiator_at: string | null
  signed_counterparty_at: string | null
  funded_at: string | null
  completed_at: string | null
  created_at: string
  initiator?: User
  counterparty?: User
  milestones?: Milestone[]
  negotiations?: NegotiationRound[]
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
}
