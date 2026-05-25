import { db } from '@/lib/db'
import { withErrorHandling } from '@/lib/api-helpers'
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

// Cleanup expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
  return withErrorHandling(async () => {
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

    const result = await db.$transaction(async (tx) => {
      // Check if this flag was already submitted correctly by this student
      const existingCorrect = await tx.flagSubmission.findFirst({
        where: { studentId, labId, flagKey, correct: true }
      })

      if (existingCorrect) {
        return {
          correct: true,
          points: 0,
          alreadyFound: true,
          message: 'Этот флаг уже найден ранее.'
        }
      }

      // Find the flag in the database
      const flag = await tx.labFlag.findFirst({
        where: { labId, flagKey }
      })

      if (!flag) {
        return { correct: false, message: 'Флаг не найден', notFound: true }
      }

      const correct = flag.flagValue === flagValue

      // Only record the first attempt and the correct submission (not repeated wrong guesses)
      const previousAttempts = await tx.flagSubmission.findMany({
        where: { studentId, labId, flagKey }
      })

      if (previousAttempts.length === 0 || correct) {
        await tx.flagSubmission.create({
          data: { studentId, labId, flagKey, flagValue, correct }
        })
      }

      if (correct) {
        // Update progress
        const existing = await tx.labProgress.findUnique({
          where: { studentId_labId: { studentId, labId } }
        })

        const lab = await tx.lab.findUnique({ where: { id: labId }, include: { flags: true } })
        const totalFlags = lab?.flags.length ?? 0

        if (existing) {
          const newFlagsFound = existing.flagsFound + 1
          const newScore = existing.score + flag.points
          const isComplete = newFlagsFound >= totalFlags

          await tx.labProgress.update({
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
          const isComplete = 1 >= totalFlags

          await tx.labProgress.create({
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

      return {
        correct,
        points: correct ? flag.points : 0,
        message: correct ? `Флаг принят! +${flag.points} баллов` : 'Неверный флаг. Попробуйте ещё раз.'
      }
    })

    if ('notFound' in result) {
      return NextResponse.json({ correct: result.correct, message: result.message }, { status: 404 })
    }

    return NextResponse.json(result)
  }, 'POST /api/flags')
}
