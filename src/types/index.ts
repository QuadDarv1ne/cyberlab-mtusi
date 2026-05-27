export interface LabFlag {
  id: string
  flagKey: string
  points: number
  hint: string | null
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
  flags: LabFlag[]
}

export interface StudentDb {
  id: string
  name: string
  group: string
}

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
  createdAt: string
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

export interface FoundFlag {
  labId: string
  flagKey: string
}

export interface ProgressRecord {
  labId: string
  status: string
  flagsFound: number
  totalFlags: number
  score: number
}

export interface BlogArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string
  coverImage: string | null
  publishedAt: string
}
