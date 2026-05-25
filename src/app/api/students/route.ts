import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'

export async function GET() {
  return withErrorHandling(async () => {
    const students = await db.student.findMany({
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
