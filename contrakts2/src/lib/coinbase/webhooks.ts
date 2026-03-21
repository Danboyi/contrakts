import crypto from 'node:crypto'

function safeCompare(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export function verifyCoinbaseWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET

  if (!secret || secret.startsWith('your_') || !signature) {
    return false
  }

  try {
    const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    return safeCompare(sig, signature)
  } catch {
    return false
  }
}
