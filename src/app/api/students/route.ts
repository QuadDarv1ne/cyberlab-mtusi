import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const students = await db.student.findMany({
      select: {
        id: true,
        name: true,
        group: true,
        progress: { include: { lab: { select: { id: true } } } }
      },
      orderBy: { name: 'asc' }
    })
    const response = NextResponse.json(students)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('[API /students] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
