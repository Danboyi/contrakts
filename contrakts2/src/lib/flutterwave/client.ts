// SERVER-SIDE ONLY
const FLW_BASE = 'https://api.flutterwave.com/v3'

function getFlutterwaveSecret() {
  const secret = process.env.FLW_SECRET_KEY

  if (!secret || secret.startsWith('your_') || secret.includes('placeholder')) {
    throw new Error('FLW_SECRET_KEY is missing or still using a placeholder.')
  }

  return secret
}

async function flwRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${FLW_BASE}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${getFlutterwaveSecret()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (data.status !== 'success') {
    throw new Error(data.message ?? `Flutterwave error: ${res.status}`)
  }

  return data.data as T
}

export async function flwInitializePayment(params: {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: { email: string; name: string }
  meta: { contract_id: string; payment_type: string; payment_id?: string }
  payment_options?: string
}) {
  return flwRequest<{ link: string }>('POST', '/payments', params)
}

export async function flwVerifyTransaction(id: string) {
  return flwRequest<{
    status: string
    amount: number
    currency: string
    tx_ref: string
    meta: { contract_id: string; payment_type: string }
  }>('GET', `/transactions/${id}/verify`)
}

export async function flwTransfer(params: {
  account_bank: string
  account_number: string
  amount: number
  currency: string
  narration: string
  reference: string
  beneficiary_name: string
}) {
  return flwRequest<{
    id: number
    reference: string
    status: string
  }>('POST', '/transfers', params)
}
