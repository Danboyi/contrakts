import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

function createRedis() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')
  ) {
    return null
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const redis = createRedis()

export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'contrakts:api',
    })
  : null

export const loginRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      analytics: true,
      prefix: 'contrakts:login',
    })
  : null

export const webhookRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'contrakts:webhook',
    })
  : null

export async function checkRateLimit(
  limiter: typeof apiRatelimit,
  identifier: string
): Promise<{
  allowed: boolean
  remaining: number
  reset: number
}> {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Contrakts] Rate limiting is disabled. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable it.'
      )
    }

    return { allowed: true, remaining: 999, reset: 0 }
  }

  const result = await limiter.limit(identifier)

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
