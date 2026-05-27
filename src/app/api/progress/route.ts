import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Relaxed validation: allow alphanumeric, hyphens, underscores (e.g. seed-student-1)
    if (studentId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(studentId)) {
      return NextResponse.json({ error: 'Invalid studentId format' }, { status: 400 })
    }

    // Rate limit: 20 requests per minute per IP to prevent student data enumeration
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`progress:${clientIp}`, { maxRequests: 20 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const found = await db.flagSubmissionFindMany({
      where: { studentId, correct: true },
      select: { labId: true, flagKey: true }
    })

    const progress = await db.labProgressFindMany({
      where: { studentId },
      select: {
        labId: true,
        status: true,
        flagsFound: true,
        totalFlags: true,
        score: true,
      }
    })

    return cachedJson({ found, progress }, { maxAge: 30, staleWhileRevalidate: 60 })
  }, 'GET /api/progress')
}
