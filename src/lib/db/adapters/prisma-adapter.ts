import { PrismaClient } from '@prisma/client'
import type { DbType } from './base';
import { DatabaseAdapter } from './base'
import type { TransactionContext, DashboardData } from '../types'

export class PrismaAdapter extends DatabaseAdapter {
  readonly type: DbType
  private client: PrismaClient

  constructor(type: DbType) {
    super()
    this.type = type
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  }

  async connect() {
    await this.client.$connect()
  }

  async disconnect() {
    await this.client.$disconnect()
  }

  // User operations
  async userFindUnique(args: { where: { id: string } | { email: string }; include?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.user.findUnique(args as any)
  }

  async userCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.user.create(args as any)
  }

  async userUpdate(args: { where: { id: string }; data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.user.update(args as any)
  }

  async userFindMany(args: { where?: Record<string, unknown>; select?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.user.findMany(args as any)
  }

  // Student operations
  async studentFindMany(args: { select?: Record<string, unknown>; orderBy?: Record<string, unknown>; include?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.student.findMany(args as any)
  }

  async studentFindUnique(args: { where: { id: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.student.findUnique(args as any)
  }

  async studentCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.student.create(args as any)
  }

  // Lab operations
  async labFindMany(args: { include?: Record<string, unknown>; orderBy?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.lab.findMany(args as any)
  }

  async labFindUnique(args: { where: { id: string }; include?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.lab.findUnique(args as any)
  }

  // LabProgress operations
  async labProgressFindMany(args: { where: Record<string, unknown>; select?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.labProgress.findMany(args as any)
  }

  async labProgressFindUnique(args: { where: { studentId_labId: { studentId: string; labId: string } } }) {
    return this.client.labProgress.findUnique({
      where: { studentId_labId: args.where.studentId_labId }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  async labProgressUpdate(args: { where: { id: string }; data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.labProgress.update(args as any)
  }

  async labProgressCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.labProgress.create(args as any)
  }

  // LabFlag operations
  async labFlagFindFirst(args: { where: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.labFlag.findFirst(args as any)
  }

  // FlagSubmission operations
  async flagSubmissionFindMany(args: { where?: Record<string, unknown>; select?: Record<string, unknown>; orderBy?: Record<string, unknown>; take?: number; include?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.flagSubmission.findMany(args as any)
  }

  async flagSubmissionFindFirst(args: { where: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.flagSubmission.findFirst(args as any)
  }

  async flagSubmissionCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.flagSubmission.create(args as any)
  }

  async flagSubmissionGroupBy(args: { by: string[]; _count: boolean }): Promise<Array<{ correct: boolean | null; _count: number }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.flagSubmission.groupBy(args as any) as unknown as Array<{ correct: boolean | null; _count: number }>
  }

  // Article operations
  async articleFindUnique(args: { where: { slug: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.article.findUnique(args as any)
  }

  async articleFindMany(args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown>; skip?: number; take?: number }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.article.findMany(args as any)
  }

  async articleCount(args: { where?: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.article.count(args as any)
  }

  async articleCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.article.create(args as any)
  }

  async articleUpdate(args: { where: { slug: string }; data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.article.update(args as any)
  }

  async articleDelete(args: { where: { slug: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.client.article.delete(args as any)
  }

  // Dashboard aggregation
  async getDashboardData(): Promise<DashboardData> {
    const students = await this.client.student.findMany({
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

    const labs = await this.client.lab.findMany({ orderBy: { order: 'asc' } })
    const submissions = await this.client.flagSubmission.findMany({
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

    const submissionStats = await this.client.flagSubmission.groupBy({
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

    return {
      studentStats,
      labStats,
      recentSubmissions,
      totalSubmissions,
      correctSubmissions,
      totalStudents: students.length,
      totalLabs: labs.length,
    }
  }

  // Transaction wrapper
  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.$transaction(async (tx: any) => {
      return fn({
        flagSubmission: tx.flagSubmission,
        labFlag: tx.labFlag,
        labProgress: tx.labProgress,
        lab: tx.lab,
      } as unknown as TransactionContext)
    })
  }

  // Expose raw client for seed scripts
  override get rawClient(): PrismaClient {
    return this.client
  }

  // Password reset token operations
  async passwordResetTokenCreate(args: { data: Record<string, unknown> }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.passwordResetToken.create(args as any)
  }

  async passwordResetTokenConsume(args: { where: { token: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await this.client.passwordResetToken.findUnique(args as any)
    if (!record) return null
    if (record.expiresAt < new Date()) {
      await this.client.passwordResetToken.delete({ where: { id: record.id } })
      return null
    }
    await this.client.passwordResetToken.delete({ where: { id: record.id } })
    return { userId: record.userId }
  }

  async passwordResetTokenCleanup() {
    await this.client.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    })
  }
}
