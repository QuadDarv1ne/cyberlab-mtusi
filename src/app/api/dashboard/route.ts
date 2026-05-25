import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    // Rate limit: 30 requests per minute per IP
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`dashboard:${clientIp}`, { maxRequests: 30 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const students = await db.student.findMany({
      select: {
        id: true,
        name: true,
        group: true,
        progress: {
          select: {
            labId: true,
            status: true,
            score: true,
            lab: { select: { id: true, number: true, title: true, difficulty: true } },
          },
        },
      },
    })

    const labs = await db.lab.findMany({ orderBy: { order: 'asc' } })
    const submissions = await db.flagSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        student: { select: { name: true } },
        lab: { select: { title: true } },
      },
    })

    const recentSubmissions = submissions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      labId: s.labId,
      studentName: s.student.name,
      labTitle: s.lab.title,
      flagKey: s.flagKey,
      correct: s.correct,
      createdAt: s.createdAt,
    }))

    const submissionStats = await db.flagSubmission.groupBy({
      by: ['correct'],
      _count: true,
    })
    const totalSubmissions = submissionStats.reduce((sum, s) => sum + s._count, 0)
    const correctSubmissions = submissionStats.find((s) => s.correct)?._count ?? 0

    const studentStats = students.map((s) => {
      const totalScore = s.progress.reduce((sum, p) => sum + p.score, 0)
      const completedLabs = s.progress.filter((p) => p.status === 'completed').length
      const inProgressLabs = s.progress.filter((p) => p.status === 'in_progress').length
      return {
        id: s.id,
        name: s.name,
        group: s.group,
        totalScore,
        completedLabs,
        inProgressLabs,
        totalLabs: labs.length,
      }
    }).sort((a, b) => b.totalScore - a.totalScore)

    const labStats = labs.map((lab) => {
      const completed = students.filter((s) =>
        s.progress.some((p) => p.labId === lab.id && p.status === 'completed')
      ).length
      const inProgress = students.filter((s) =>
        s.progress.some((p) => p.labId === lab.id && p.status === 'in_progress')
      ).length
      return {
        id: lab.id,
        number: lab.number,
        title: lab.title,
        difficulty: lab.difficulty,
        completed,
        inProgress,
        totalStudents: students.length,
      }
    })

    return cachedJson({
      studentStats,
      labStats,
      recentSubmissions,
      totalSubmissions,
      correctSubmissions,
      totalStudents: students.length,
      totalLabs: labs.length,
    }, { maxAge: 30, staleWhileRevalidate: 120 })
  }, 'GET /api/dashboard')
}
