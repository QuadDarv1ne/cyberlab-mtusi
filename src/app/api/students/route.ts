import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    // Rate limit: 30 requests per minute per IP
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`students:${clientIp}`, { maxRequests: 30 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    // Admin-only: student list includes progress data
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const students = await db.studentFindMany({
      select: {
        id: true,
        name: true,
        group: true,
        progress: { include: { lab: { select: { id: true } } } }
      },
      orderBy: { name: 'asc' }
    })
    return cachedJson(students, { maxAge: 60, staleWhileRevalidate: 300 })
  }, 'GET /api/students')
}
