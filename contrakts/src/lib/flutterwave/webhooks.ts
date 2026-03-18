import crypto from 'node:crypto'

function safeCompare(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export function verifyFlutterwaveWebhook(
  body: string,
  signature: string
): boolean {
  const secret = process.env.FLW_WEBHOOK_SECRET

  if (!secret || secret.startsWith('your_') || !signature) {
    return false
  }

  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return safeCompare(hash, signature)
}
