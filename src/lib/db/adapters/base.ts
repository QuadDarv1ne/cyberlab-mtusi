import type {
  Student, Lab, LabFlag, LabProgress, FlagSubmission, Article, User,
  DashboardData, TransactionContext
} from '../types'

export type DbType = 'sqlite' | 'postgresql' | 'mongodb'

/**
 * Abstract database adapter interface.
 * All database implementations must conform to this contract.
 */
export abstract class DatabaseAdapter {
  abstract readonly type: DbType

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>

  /** Returns the raw database client for seed scripts and migrations. */
  get rawClient(): unknown {
    throw new Error('rawClient is not supported for this database type')
  }

  // User operations
  abstract userFindUnique(args: {
    where: { id: string } | { email: string }
    include?: Record<string, unknown>
  }): Promise<User | null>
  abstract userCreate(args: {
    data: Record<string, unknown>
  }): Promise<User>
  abstract userUpdate(args: {
    where: { id: string }
    data: Record<string, unknown>
  }): Promise<User>
  abstract userFindMany(args: {
    where?: Record<string, unknown>
    select?: Record<string, unknown>
  }): Promise<User[]>

  // Student operations
  abstract studentFindMany(args: {
    select?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    include?: Record<string, unknown>
  }): Promise<Student[]>
  abstract studentFindUnique(args: {
    where: { id: string }
  }): Promise<Student | null>

  // Lab operations
  abstract labFindMany(args: {
    include?: Record<string, unknown>
    orderBy?: Record<string, unknown>
  }): Promise<Lab[]>
  abstract labFindUnique(args: {
    where: { id: string }
    include?: Record<string, unknown>
  }): Promise<Lab | null>

  // LabProgress operations
  abstract labProgressFindMany(args: {
    where: Record<string, unknown>
    select?: Record<string, unknown>
  }): Promise<LabProgress[]>
  abstract labProgressFindUnique(args: {
    where: { studentId_labId: { studentId: string; labId: string } }
  }): Promise<LabProgress | null>
  abstract labProgressUpdate(args: {
    where: { id: string }
    data: Record<string, unknown>
  }): Promise<LabProgress>
  abstract labProgressCreate(args: {
    data: Record<string, unknown>
  }): Promise<LabProgress>

  // LabFlag operations
  abstract labFlagFindFirst(args: {
    where: Record<string, unknown>
  }): Promise<LabFlag | null>

  // FlagSubmission operations
  abstract flagSubmissionFindMany(args: {
    where?: Record<string, unknown>
    select?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    take?: number
    include?: Record<string, unknown>
  }): Promise<FlagSubmission[]>
  abstract flagSubmissionFindFirst(args: {
    where: Record<string, unknown>
  }): Promise<FlagSubmission | null>
  abstract flagSubmissionCreate(args: {
    data: Record<string, unknown>
  }): Promise<FlagSubmission>
  abstract flagSubmissionGroupBy(args: {
    by: string[]
    _count: boolean
  }): Promise<Array<{ correct: boolean | null; _count: number }>>

  // Article operations
  abstract articleFindUnique(args: {
    where: { slug: string }
  }): Promise<Article | null>
  abstract articleFindMany(args: {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    skip?: number
    take?: number
  }): Promise<Article[]>
  abstract articleCount(args: {
    where?: Record<string, unknown>
  }): Promise<number>
  abstract articleCreate(args: {
    data: Record<string, unknown>
  }): Promise<Article>

  // Dashboard aggregation (optimized per-database)
  abstract getDashboardData(): Promise<DashboardData>

  // Transaction wrapper (critical for flags/route.ts atomic operations)
  abstract transaction<T>(
    fn: (tx: TransactionContext) => Promise<T>
  ): Promise<T>

  // Password reset token operations
  abstract passwordResetTokenCreate(args: {
    data: Record<string, unknown>
  }): Promise<{ id: string; token: string; userId: string; expiresAt: Date }>
  abstract passwordResetTokenConsume(args: {
    where: { token: string }
  }): Promise<{ userId: string } | null>
  abstract passwordResetTokenCleanup(): Promise<void>
}
