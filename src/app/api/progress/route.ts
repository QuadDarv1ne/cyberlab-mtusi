import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
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

  return NextResponse.json({ found, progress })
}
