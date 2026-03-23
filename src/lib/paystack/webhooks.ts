import crypto from 'node:crypto'

function safeCompare(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export function verifyPaystackWebhook(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET

  if (!secret || secret.startsWith('your_') || !signature) {
    return false
  }

  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return safeCompare(hash, signature)
}

export type PaystackEvent =
  | { event: 'charge.success'; data: PaystackCharge }
  | { event: 'transfer.success'; data: PaystackTransfer }
  | { event: 'transfer.failed'; data: PaystackTransfer }
  | { event: 'transfer.reversed'; data: PaystackTransfer }

export interface PaystackCharge {
  id: number
  reference: string
  amount: number
  currency: string
  status: string
  metadata: {
    contract_id?: string
    dispute_id?: string
    payment_type: string
    [key: string]: unknown
  }
  customer: { email: string }
}

export interface PaystackTransfer {
  id: number
  reference: string
  amount: number
  currency: string
  status: string
  transfer_code: string
}
