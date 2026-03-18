import crypto from 'crypto'

const KEY_PREFIX = 'ctk_'
const KEY_VERSION = 'v1'

export type ApiScope =
  | 'contracts:read'
  | 'contracts:write'
  | 'milestones:read'
  | 'milestones:write'
  | 'payments:read'
  | 'webhooks:manage'

export const ALL_SCOPES: ApiScope[] = [
  'contracts:read',
  'contracts:write',
  'milestones:read',
  'milestones:write',
  'payments:read',
  'webhooks:manage',
]

export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  'contracts:read': 'Read contract details and status',
  'contracts:write': 'Create and update contracts',
  'milestones:read': 'Read milestone details',
  'milestones:write': 'Update milestone status',
  'payments:read': 'Read payment and escrow data',
  'webhooks:manage': 'Create and manage webhook subscriptions',
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): {
  raw: string
  hash: string
  prefix: string
} {
  const random = crypto.randomBytes(32).toString('hex')
  const raw = `${KEY_PREFIX}${KEY_VERSION}_${random}`
  const hash = hashApiKey(raw)
  const prefix = raw.slice(0, 14)

  return { raw, hash, prefix }
}
