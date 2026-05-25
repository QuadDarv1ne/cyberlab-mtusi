import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { studentId, labId, flagKey, flagValue } = body

  if (!studentId || !labId || !flagKey || !flagValue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if this flag was already submitted correctly by this student
  const existingCorrect = await db.flagSubmission.findFirst({
    where: { studentId, labId, flagKey, correct: true }
  })

  if (existingCorrect) {
    return NextResponse.json({
      correct: true,
      points: 0,
      alreadyFound: true,
      message: 'Этот флаг уже найден ранее.'
    })
  }

  // Find the flag in the database
  const flag = await db.labFlag.findFirst({
    where: { labId, flagKey }
  })

  if (!flag) {
    return NextResponse.json({ correct: false, message: 'Флаг не найден' }, { status: 404 })
  }

  const correct = flag.flagValue === flagValue

  // Record submission
  await db.flagSubmission.create({
    data: { studentId, labId, flagKey, flagValue, correct }
  })

  if (correct) {
    // Update progress
    const existing = await db.labProgress.findUnique({
      where: { studentId_labId: { studentId, labId } }
    })

    if (existing) {
      const newFlagsFound = existing.flagsFound + 1
      const lab = await db.lab.findUnique({ where: { id: labId }, include: { flags: true } })
      const totalFlags = lab?.flags.length ?? 0
      const newScore = existing.score + flag.points
      const isComplete = newFlagsFound >= totalFlags

      await db.labProgress.update({
        where: { id: existing.id },
        data: {
          flagsFound: newFlagsFound,
          totalFlags,
          score: newScore,
          status: isComplete ? 'completed' : 'in_progress',
          completedAt: isComplete ? new Date() : undefined,
        }
      })
    } else {
      const lab = await db.lab.findUnique({ where: { id: labId }, include: { flags: true } })
      const totalFlags = lab?.flags.length ?? 0
      const isComplete = 1 >= totalFlags

      await db.labProgress.create({
        data: {
          studentId,
          labId,
          flagsFound: 1,
          totalFlags,
          score: flag.points,
          status: isComplete ? 'completed' : 'in_progress',
          startedAt: new Date(),
          completedAt: isComplete ? new Date() : undefined,
        }
      })
    }
  }

  return NextResponse.json({
    correct,
    points: correct ? flag.points : 0,
    message: correct ? `Флаг принят! +${flag.points} баллов` : 'Неверный флаг. Попробуйте ещё раз.'
  })
}
