function isPlaceholder(value?: string) {
  return !value || value.startsWith('your_')
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    return false
  }

  try {
    new URL(url!)
    return true
  } catch {
    return false
  }
}

export function isSupabaseAdminConfigured() {
  return (
    isSupabaseConfigured() &&
    !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl || isPlaceholder(appUrl)) {
    return 'http://localhost:3000'
  }

  return appUrl
}
