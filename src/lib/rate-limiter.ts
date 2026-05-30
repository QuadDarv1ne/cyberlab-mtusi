/**
 * Universal rate limiter for API routes.
 * Uses in-memory Map with automatic cleanup of expired entries.
 * Suitable for single-instance deployments.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

// Cleanup expired entries periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)
cleanupTimer.unref()

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds (default: 60000ms = 1 minute) */
  windowMs?: number
}

/**
 * Check if a request is within rate limits.
 * @param identifier - Unique key for the rate limit (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const { maxRequests, windowMs = 60_000 } = options
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

/**
 * Get client IP address from request headers.
 * Only trusts x-forwarded-for when NODE_ENV is production (behind a reverse proxy
 * that strips client-supplied headers). In development, uses the direct connection.
 * Falls back to a per-session unique ID via cookie to prevent all
 * unidentified clients from sharing the same rate-limit bucket.
 */
export function getClientIp(request: Request): string {
  // In production behind a reverse proxy, trust x-forwarded-for
  if (process.env.NODE_ENV === 'production') {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) {
      return realIp
    }
  }

  // Use client ID set by middleware (cookie or forwarded header)
  const clientId = request.headers.get('x-client-id')
  if (clientId) {
    return `anon:${clientId}`
  }

  // Fallback: check for clid cookie directly (should be set by middleware)
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)clid=([^;]+)/)
  if (match) {
    return `anon:${match[1]}`
  }

  // No persistent identity available - use a fixed fallback to prevent
  // rate limit bypass. Using a constant ensures all unidentified clients
  // share the same rate limit bucket rather than getting unlimited requests.
  return 'anon:unknown'
}


