import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    // Rate limit: 30 requests per minute per IP
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`dashboard:${clientIp}`, { maxRequests: 30 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const dashboardData = await db.getDashboardData()

    return cachedJson(dashboardData, { maxAge: 30, staleWhileRevalidate: 120 })
  }, 'GET /api/dashboard')
}
