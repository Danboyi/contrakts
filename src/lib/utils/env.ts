const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

const OPTIONAL_SERVER_VARS = [
  'PAYSTACK_SECRET_KEY',
  'FLW_SECRET_KEY',
  'COINBASE_COMMERCE_API_KEY',
  'RESEND_API_KEY',
] as const

let hasValidatedEnv = false

export function validateEnv() {
  if (hasValidatedEnv) {
    return
  }

  const missing: string[] = []

  for (const key of REQUIRED_SERVER_VARS) {
    const value = process.env[key]
    if (!value || value.includes('placeholder')) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n` +
        'Add these to your .env.local file.'
    )
  }

  for (const key of OPTIONAL_SERVER_VARS) {
    const value = process.env[key]
    if (!value || value.includes('placeholder')) {
      console.warn(
        `[Contrakts] Optional env var ${key} is not configured. Related features will not work.`
      )
    }
  }

  hasValidatedEnv = true
}
