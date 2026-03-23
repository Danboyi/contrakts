import type { Deliverable } from './contract'

export type SubmissionState =
  | 'pending_review'
  | 'in_review'
  | 'approved'
  | 'revision_requested'
  | 'rejected'

export type SubmissionType = 'files' | 'link' | 'code' | 'mixed'

export type ReviewVerdict =
  | 'approved'
  | 'revision_requested'
  | 'rejected'

export type FeedbackItemType = 'issue' | 'suggestion' | 'praise'

export interface FeedbackItem {
  type: FeedbackItemType
  content: string
  file_ref?: string
}

export interface SubmissionReview {
  id: string
  submission_id: string
  reviewer_id: string
  verdict: ReviewVerdict
  feedback: string | null
  feedback_items: FeedbackItem[]
  created_at: string
  reviewer?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface Submission {
  id: string
  contract_id: string
  milestone_id: string
  submitted_by: string
  version: number
  state: SubmissionState
  note: string | null
  submission_type: SubmissionType
  external_url: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  deliverables?: Deliverable[]
  reviews?: SubmissionReview[]
  submitter?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}
