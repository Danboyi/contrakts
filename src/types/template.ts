export interface TemplateMilestone {
  id: string
  template_id: string
  order_index: number
  title: string
  description: string | null
  amount_hint: number | null
}

export interface ContractTemplate {
  id: string
  title: string
  description: string | null
  industry: string
  currency: string
  terms: string | null
  is_system: boolean
  is_public: boolean
  author_id: string | null
  use_count: number
  created_at: string
  updated_at: string
  milestones?: TemplateMilestone[]
  author?: { full_name: string } | null
}
