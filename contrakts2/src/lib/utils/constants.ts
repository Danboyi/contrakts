export const CONTRACT_STATES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  FUNDED: 'funded',
  ACTIVE: 'active',
  IN_REVIEW: 'in_review',
  DISPUTED: 'disputed',
  COMPLETE: 'complete',
  VOIDED: 'voided',
} as const

export const MILESTONE_STATES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  DISPUTED: 'disputed',
  APPROVED: 'approved',
  PAID: 'paid',
} as const

export const PLATFORM_FEE_PCT = 2.0

export const AUTO_RELEASE_HOURS = 72

export const DISPUTE_RESPONSE_HOURS = 48

export const INDUSTRIES = [
  { value: 'creative', label: 'Creative & Design' },
  { value: 'construction', label: 'Construction & Renovation' },
  { value: 'consulting', label: 'Consulting & Advisory' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'software', label: 'Software & Tech' },
  { value: 'events', label: 'Events & Production' },
  { value: 'supply', label: 'Supply & Manufacturing' },
  { value: 'other', label: 'Other' },
] as const

export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { value: 'NGN', label: 'NGN — Nigerian Naira', symbol: '₦' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { value: 'GHS', label: 'GHS — Ghanaian Cedi', symbol: '₵' },
  { value: 'KES', label: 'KES — Kenyan Shilling', symbol: 'KSh' },
] as const
