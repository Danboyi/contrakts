export interface AiMilestone {
  title: string
  description: string
  amount: number
  percentage: number
  deadline_days: number
}

export interface AiRiskFlag {
  severity: 'low' | 'medium' | 'high'
  section: 'terms' | 'milestones' | 'general'
  title: string
  description: string
  suggestion: string
}

export interface AiContractDraft {
  title: string
  description: string
  industry: string
  currency: string
  estimated_value: number
  duration_days: number
  terms: string
  milestones: AiMilestone[]
  risk_flags: AiRiskFlag[]
  confidence: number
  language_used: string
}

export interface AiDisputeAnalysis {
  dispute_id: string
  recommended_ruling:
    | 'vendor_wins'
    | 'client_wins'
    | 'partial'
    | 'insufficient_evidence'
  vendor_pct: number
  confidence: number
  reasoning: string
  key_factors: string[]
  evidence_summary: {
    client_case: string
    vendor_case: string
    gap_analysis: string
  }
  contract_compliance: {
    scope_met: boolean
    quality_met: boolean | null
    deadline_met: boolean | null
    assessment: string
  }
  auto_resolvable: boolean
  appeal_risk: 'low' | 'medium' | 'high'
  created_at: string
}

export interface AiStreamChunk {
  type: 'title' | 'milestone' | 'terms' | 'risk' | 'complete' | 'error'
  content: string
  data?: Partial<AiContractDraft>
}
