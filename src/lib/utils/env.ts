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

function isConfigured(value: string | undefined) {
  return Boolean(value && !value.includes('placeholder'))
}

export function validateEnv() {
  if (hasValidatedEnv) {
    return
  }

  const missing: string[] = []

  for (const key of REQUIRED_SERVER_VARS) {
    const value = process.env[key]
    if (!isConfigured(value)) {
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
    if (!isConfigured(value)) {
      console.warn(
        `[Contrakts] Optional env var ${key} is not configured. Related features will not work.`
      )
    }
  }

  if (
    !isConfigured(process.env.OPENAI_API_KEY) &&
    !isConfigured(process.env.ANTHROPIC_API_KEY)
  ) {
    console.warn(
      '[Contrakts] Optional env vars OPENAI_API_KEY / ANTHROPIC_API_KEY are not configured. AI features will not work.'
    )
  }

  hasValidatedEnv = true
}
