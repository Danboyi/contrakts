export type PaymentType =
  | 'escrow_deposit'
  | 'milestone_release'
  | 'refund'
  | 'platform_fee'

export type PaymentProvider =
  | 'paystack'
  | 'flutterwave'
  | 'coinbase_commerce'

export interface Payment {
  id: string
  contract_id: string
  milestone_id: string | null
  payment_type: PaymentType
  provider: PaymentProvider
  provider_ref: string | null
  provider_status: 'pending' | 'success' | 'failed'
  gross_amount: number
  fee_amount: number
  net_amount: number
  currency: string
  recipient_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
