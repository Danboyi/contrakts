// SERVER-SIDE ONLY
const PAYSTACK_BASE = 'https://api.paystack.co'

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY

  if (!secret || secret.startsWith('your_') || secret.includes('placeholder')) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is missing or still using a placeholder. Configure a Paystack test secret before using escrow flows.'
    )
  }

  return secret
}

async function paystackRequest<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok || !data.status) {
    throw new Error(data.message ?? `Paystack error: ${res.status}`)
  }

  return data.data as T
}

export async function paystackInitialize(params: {
  email: string
  amount: number
  reference: string
  callback_url: string
  metadata?: Record<string, unknown>
  currency?: string
}) {
  return paystackRequest<{
    authorization_url: string
    access_code: string
    reference: string
  }>('POST', '/transaction/initialize', params)
}

export async function paystackVerify(reference: string) {
  return paystackRequest<{
    status: string
    amount: number
    currency: string
    reference: string
    metadata: Record<string, unknown>
  }>('GET', `/transaction/verify/${reference}`)
}

export async function paystackCreateRecipient(params: {
  type: string
  name: string
  account_number: string
  bank_code: string
  currency: string
}) {
  return paystackRequest<{
    recipient_code: string
    id: number
  }>('POST', '/transferrecipient', params)
}

export async function paystackTransfer(params: {
  source: string
  amount: number
  recipient: string
  reason: string
  reference: string
}) {
  return paystackRequest<{
    transfer_code: string
    status: string
    reference: string
  }>('POST', '/transfer', params)
}

export async function paystackVerifyTransfer(reference: string) {
  return paystackRequest<{
    status: string
    transfer_code: string
    reference: string
  }>('GET', `/transfer/verify/${reference}`)
}
