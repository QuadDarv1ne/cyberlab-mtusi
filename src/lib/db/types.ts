/**
 * Shared TypeScript interfaces for database abstraction layer.
 * Used by all adapters (Prisma for SQLite/PostgreSQL, native MongoDB).
 */

export interface Student {
  id: string
  name: string
  group: string
  createdAt: Date
}

export interface Lab {
  id: string
  number: number
  title: string
  description: string
  goal: string
  tools: string
  difficulty: string
  category: string
  order: number
  createdAt: Date
  flags?: LabFlag[]
}

export interface LabFlag {
  id: string
  labId: string
  flagKey: string
  flagValue: string
  points: number
  hint: string | null
}

export interface LabProgress {
  id: string
  studentId: string
  labId: string
  status: string
  flagsFound: number
  totalFlags: number
  score: number
  startedAt: Date | null
  completedAt: Date | null
}

export interface FlagSubmission {
  id: string
  studentId: string
  labId: string
  flagKey: string
  flagValue: string
  correct: boolean
  createdAt: Date
  student?: { name: string }
  lab?: { title: string }
}

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string
  coverImage: string | null
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

// Dashboard aggregated types
export interface StudentStat {
  id: string
  name: string
  group: string
  totalScore: number
  completedLabs: number
  inProgressLabs: number
  totalLabs: number
}

export interface LabStat {
  id: string
  number: number
  title: string
  difficulty: string
  completed: number
  inProgress: number
  totalStudents: number
}

export interface RecentSubmission {
  id: string
  studentId: string
  labId: string
  studentName: string
  labTitle: string
  flagKey: string
  correct: boolean
  createdAt: Date
}

export interface DashboardData {
  studentStats: StudentStat[]
  labStats: LabStat[]
  recentSubmissions: RecentSubmission[]
  totalSubmissions: number
  correctSubmissions: number
  totalStudents: number
  totalLabs: number
}

// Transaction context for atomic flag submission
export interface TransactionContext {
  flagSubmission: {
    findFirst(args: { where: Record<string, unknown> }): Promise<FlagSubmission | null>
    create(args: { data: Record<string, unknown> }): Promise<FlagSubmission>
    findMany(args: { where: Record<string, unknown> }): Promise<FlagSubmission[]>
  }
  labFlag: {
    findFirst(args: { where: Record<string, unknown> }): Promise<LabFlag | null>
  }
  labProgress: {
    findUnique(args: { where: Record<string, unknown> }): Promise<LabProgress | null>
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<LabProgress>
    create(args: { data: Record<string, unknown> }): Promise<LabProgress>
  }
  lab: {
    findUnique(args: { where: { id: string }; include?: Record<string, unknown> }): Promise<Lab | null>
  }
}
