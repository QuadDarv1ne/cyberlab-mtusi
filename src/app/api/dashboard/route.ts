import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const students = await db.student.findMany({
    include: {
      progress: { include: { lab: true } }
    }
  })

  const labs = await db.lab.findMany({ orderBy: { order: 'asc' } })
  const submissions = await db.flagSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const totalSubmissions = await db.flagSubmission.count()
  const correctSubmissions = await db.flagSubmission.count({ where: { correct: true } })

  // Per-student stats
  const studentStats = students.map(s => {
    const totalScore = s.progress.reduce((sum, p) => sum + p.score, 0)
    const completedLabs = s.progress.filter(p => p.status === 'completed').length
    const inProgressLabs = s.progress.filter(p => p.status === 'in_progress').length
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
  const labStats = labs.map(lab => {
    const completed = students.filter(s =>
      s.progress.some(p => p.labId === lab.id && p.status === 'completed')
    ).length
    const inProgress = students.filter(s =>
      s.progress.some(p => p.labId === lab.id && p.status === 'in_progress')
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
    recentSubmissions: submissions,
    totalSubmissions,
    correctSubmissions,
    totalStudents: students.length,
    totalLabs: labs.length,
  })
}
