import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    if (studentId.length > 100) {
      return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 })
    }

    const found = await db.flagSubmission.findMany({
      where: { studentId, correct: true },
      select: { labId: true, flagKey: true }
    })

    const progress = await db.labProgress.findMany({
      where: { studentId },
      select: {
        labId: true,
        status: true,
        flagsFound: true,
        totalFlags: true,
        score: true,
      }
    })

    const response = NextResponse.json({ found, progress })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error('[API /progress] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
