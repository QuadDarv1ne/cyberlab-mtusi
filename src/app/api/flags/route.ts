import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const flagSubmissionSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  labId: z.string().min(1, 'labId is required'),
  flagKey: z.string().min(1, 'flagKey is required'),
  flagValue: z.string().min(1, 'flagValue is required').max(200, 'Flag value too long'),
})

// Simple in-memory rate limiter: 10 attempts per minute per student+lab
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count }
}

export async function POST(req: Request) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = flagSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const { studentId, labId, flagKey, flagValue } = parsed.data

  // Rate limiting: 10 attempts per minute per student+lab
  const rateKey = `${studentId}:${labId}`
  const rate = checkRateLimit(rateKey)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Слишком много попыток. Подождите минуту.' }, { status: 429 })
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

  // Only record the first attempt and the correct submission (not repeated wrong guesses)
  const previousAttempts = await db.flagSubmission.findMany({
    where: { studentId, labId, flagKey }
  })

  if (previousAttempts.length === 0 || correct) {
    await db.flagSubmission.create({
      data: { studentId, labId, flagKey, flagValue, correct }
    })
  }

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
