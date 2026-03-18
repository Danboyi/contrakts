export type DisputeStatus =
  | 'open'
  | 'awaiting_response'
  | 'under_review'
  | 'clarification'
  | 'resolved'
  | 'appealed'

export type DisputeReason =
  | 'scope_mismatch'
  | 'non_delivery'
  | 'quality'
  | 'payment_delay'
  | 'other'

export type DisputeRuling =
  | 'vendor_wins'
  | 'client_wins'
  | 'partial'
  | 'cancelled'

export interface Dispute {
  id: string
  contract_id: string
  milestone_id: string
  raised_by: string
  respondent_id: string
  status: DisputeStatus
  reason: DisputeReason
  description: string
  ruling: DisputeRuling | null
  ruling_notes: string | null
  ruling_pct_vendor: number | null
  arbitrator_id: string | null
  dispute_fee_paid: boolean
  raised_at: string
  response_due_at: string
  resolved_at: string | null
  evidence?: DisputeEvidence[]
}

export interface DisputeEvidence {
  id: string
  dispute_id: string
  submitted_by: string
  file_url: string | null
  file_name: string | null
  description: string | null
  created_at: string
}
