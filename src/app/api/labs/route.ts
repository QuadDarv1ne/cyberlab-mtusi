import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'

export async function GET() {
  return withErrorHandling(async () => {
    const labs = await db.lab.findMany({
      include: {
        flags: {
          select: {
            id: true,
            flagKey: true,
            points: true,
            hint: true,
            // NOTE: flagValue is intentionally excluded to prevent flag exposure
          }
        }
      },
      orderBy: { order: 'asc' }
    })
    return cachedJson(labs, { maxAge: 60, staleWhileRevalidate: 300 })
  }, 'GET /api/labs')
}
