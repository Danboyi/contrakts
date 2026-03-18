export type KYCStatus = 'unverified' | 'pending' | 'verified'
export type PayoutPreference = 'fiat' | 'crypto'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  kyc_status: KYCStatus
  trust_score: number
  total_contracts: number
  completed_count: number
  dispute_count: number
  paystack_recipient_code: string | null
  bank_account_number: string | null
  bank_code: string | null
  bank_name: string | null
  wallet_address: string | null
  preferred_payout: PayoutPreference
  created_at: string
}
