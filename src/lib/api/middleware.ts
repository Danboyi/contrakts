import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/config'
import { apiRatelimit, checkRateLimit } from '@/lib/utils/rate-limit'
import { hashApiKey } from './keys'
import type { ApiScope } from './keys'

export interface ApiContext {
  userId: string
  keyId: string
  scopes: string[]
}

export type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext,
  params?: Record<string, string>
) => Promise<NextResponse>

export function withApiAuth(handler: ApiHandler, requiredScope: ApiScope) {
  return async (
    req: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Missing API key. Include: Authorization: Bearer <key>',
          success: false,
        },
        { status: 401 }
      )
    }

    const rawKey = authHeader.slice(7).trim()
    if (!rawKey.startsWith('ctk_')) {
      return NextResponse.json(
        { error: 'Invalid API key format.', success: false },
        { status: 401 }
      )
    }

    if (!isSupabaseAdminConfigured()) {
      return apiError(
        'Public API access is not configured yet.',
        503
      )
    }

    const supabaseAdmin = createAdminClient()
    const hash = hashApiKey(rawKey)
    const { data: keyRecord } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, scopes, revoked_at')
      .eq('key_hash', hash)
      .maybeSingle()

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key.', success: false },
        { status: 401 }
      )
    }

    if (keyRecord.revoked_at) {
      return NextResponse.json(
        { error: 'This API key has been revoked.', success: false },
        { status: 401 }
      )
    }

    if (!keyRecord.scopes.includes(requiredScope)) {
      return NextResponse.json(
        {
          error: `This key does not have the '${requiredScope}' scope.`,
          required_scope: requiredScope,
          key_scopes: keyRecord.scopes,
          success: false,
        },
        { status: 403 }
      )
    }

    const rateLimit = await checkRateLimit(
      apiRatelimit,
      keyRecord.id
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Max 60 requests per minute.',
          success: false,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.reset),
            'Retry-After': String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000)
            ),
          },
        }
      )
    }

    void supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)

    const ctx: ApiContext = {
      userId: keyRecord.user_id,
      keyId: keyRecord.id,
      scopes: keyRecord.scopes,
    }

    const response = await handler(req, ctx, params)
    response.headers.set('X-RateLimit-Limit', '60')
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset))

    return response
  }
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, success: true }, { status })
}

export function apiError(
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, success: false, ...details },
    { status }
  )
}
