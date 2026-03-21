// SERVER-SIDE ONLY
const CB_BASE = 'https://api.commerce.coinbase.com'

function getCoinbaseApiKey() {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY

  if (!apiKey || apiKey.startsWith('your_') || apiKey.includes('placeholder')) {
    throw new Error(
      'COINBASE_COMMERCE_API_KEY is missing or still using a placeholder.'
    )
  }

  return apiKey
}

async function cbRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${CB_BASE}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      'X-CC-Api-Key': getCoinbaseApiKey(),
      'X-CC-Version': '2018-03-22',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Coinbase error: ${res.status}`)
  }

  return data.data as T
}

export async function createCryptoCharge(params: {
  name: string
  description: string
  amount: string
  currency: 'USDC' | 'USDT'
  metadata: {
    contract_id: string
    payment_type: string
  }
  redirect_url: string
  cancel_url: string
}) {
  return cbRequest<{
    id: string
    code: string
    hosted_url: string
    expires_at: string
  }>('POST', '/charges', {
    name: params.name,
    description: params.description,
    pricing_type: 'fixed_price',
    local_price: {
      amount: params.amount,
      currency: params.currency,
    },
    metadata: params.metadata,
    redirect_url: params.redirect_url,
    cancel_url: params.cancel_url,
  })
}

export async function getCryptoCharge(chargeId: string) {
  return cbRequest<{
    id: string
    code: string
    timeline: Array<{ status: string; time: string }>
    payments: Array<{
      value: { local: { amount: string; currency: string } }
      status: string
      network: string
    }>
  }>('GET', `/charges/${chargeId}`)
}
