import { db } from '@/lib/db'
import { withErrorHandling } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { constantTimeCompare } from '@/lib/constant-time-compare'

const flagSubmissionSchema = z.object({
  labId: z.string().min(1, 'labId is required'),
  flagKey: z.string().min(1, 'flagKey is required'),
  flagValue: z.string().min(1, 'flagValue is required').max(200, 'Flag value too long'),
})

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    // Auth: read user from middleware headers
    const userId = req.headers.get('x-user-id')
    const studentId = req.headers.get('x-user-student-id')
    if (!userId || !studentId) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

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

    const { labId, flagKey, flagValue } = parsed.data

    // Dual rate limiting: per IP (brute force) and per student+lab (fair use)
    const clientIp = getClientIp(req)
    const ipRate = checkRateLimit(`flags-ip:${clientIp}`, { maxRequests: 20 })
    if (!ipRate.allowed) {
      return NextResponse.json({ error: 'Слишком много попыток. Подождите минуту.' }, { status: 429 })
    }

    const rateKey = `flags:${studentId}:${labId}`
    const rate = checkRateLimit(rateKey, { maxRequests: 10 })
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Слишком много попыток. Подождите минуту.' }, { status: 429 })
    }

    // Verify student exists
    const student = await db.studentFindUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 })
    }

    // Verify lab exists
    const lab = await db.labFindUnique({ where: { id: labId } })
    if (!lab) {
      return NextResponse.json({ error: 'Лабораторная работа не найдена' }, { status: 404 })
    }

    const result = await db.transaction(async (tx) => {
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

      const correct = constantTimeCompare(flag.flagValue, flagValue)

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

        const labWithFlags = await tx.lab.findUnique({ where: { id: labId }, include: { flags: true } })
        const totalFlags = labWithFlags?.flags?.length ?? 0

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
