import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const recentSubmissions = submissions.map((s: {
    id: string;
    student: { name: string };
    lab: { title: string };
    flagKey: string;
    correct: boolean;
    createdAt: Date;
  }) => ({
    id: s.id,
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
  const totalSubmissions = submissionStats.reduce((sum: number, s: { correct: boolean; _count: number }) => sum + s._count, 0)
  const correctSubmissions = submissionStats.find((s: { correct: boolean; _count: number }) => s.correct)?._count ?? 0

  // Per-student stats
  const studentStats = students.map((s) => {
    const totalScore = s.progress.reduce((sum: number, p) => sum + p.score, 0)
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

  // Per-lab stats
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

  return NextResponse.json({
    studentStats,
    labStats,
    recentSubmissions,
    totalSubmissions,
    correctSubmissions,
    totalStudents: students.length,
    totalLabs: labs.length,
  })
}
