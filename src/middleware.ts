import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { checkRateLimit, loginRatelimit } from '@/lib/utils/rate-limit'
import { NextResponse, type NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

const PUBLIC_PATHS = ['/login', '/signup', '/invite', '/auth', '/u']
const ADMIN_PATHS = ['/admin']
const PUBLIC_API_PATHS = ['/api/v1']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicApi = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isPublicApi) {
    return NextResponse.next()
  }

  const ipHeader =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const ip = ipHeader.split(',')[0]?.trim() || 'unknown'

  if (pathname === '/login' || pathname === '/signup') {
    const loginLimit = await checkRateLimit(
      loginRatelimit,
      `login:${ip}`
    )
    if (!loginLimit.allowed) {
      return NextResponse.redirect(
        new URL('/login?error=too_many_attempts', request.url)
      )
    }
  }

  if (!isSupabaseConfigured()) {
    if (!isPublic && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isProduction,
              sameSite: 'lax',
              httpOnly: true,
            })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path))

  if (isAdminPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && !isPublic && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (
    user &&
    (pathname === '/' || pathname === '/login' || pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/v1).*)'],
}
