import { MongoClient, ObjectId } from 'mongodb'
import type { DbType } from './base';
import { DatabaseAdapter } from './base'
import type { TransactionContext, DashboardData, LabProgress, FlagSubmission, Article, Student, Lab, LabFlag, RecentSubmission } from '../types'

interface Collections {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  students: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labs: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labFlags: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labProgress: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flagSubmissions: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  articles: any
}

export class MongoAdapter extends DatabaseAdapter {
  readonly type: DbType = 'mongodb'
  private client: MongoClient
  private collections: Collections | null = null

  constructor() {
    super()
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberlab'
    this.client = new MongoClient(uri)
  }

  async connect() {
    await this.client.connect()
    const dbName = process.env.MONGODB_DB || 'cyberlab'
    const db = this.client.db(dbName)
    this.collections = {
      students: db.collection('students'),
      labs: db.collection('labs'),
      labFlags: db.collection('lab_flags'),
      labProgress: db.collection('lab_progress'),
      flagSubmissions: db.collection('flag_submissions'),
      articles: db.collection('articles'),
    }
  }

  async disconnect() {
    await this.client.close()
  }

  private get cols(): Collections {
    if (!this.collections) throw new Error('MongoDB not connected')
    return this.collections
  }

  // Helper: Map Prisma select to MongoDB projection
  private mapSelectToProjection(select: Record<string, unknown>): Record<string, number> {
    const projection: Record<string, number> = {}
    for (const [key, value] of Object.entries(select)) {
      if (typeof value === 'boolean') {
        projection[key] = value ? 1 : 0
      } else if (typeof value === 'object' && value !== null) {
        projection[key] = 1
      }
    }
    return projection
  }

  // Helper: Map Prisma orderBy to MongoDB sort
  private mapOrderByToSort(orderBy: Record<string, unknown>): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {}
    for (const [key, value] of Object.entries(orderBy)) {
      sort[key] = value === 'asc' ? 1 : -1
    }
    return sort
  }

  // Helper: Convert string ID to ObjectId if valid
  private toObjectId(id: string): ObjectId | string {
    return ObjectId.isValid(id) ? new ObjectId(id) : id
  }

  // Helper: Map _id to id for a single document
  private mapDoc<T>(doc: Record<string, unknown>): T {
    const { _id, ...rest } = doc
    const id = typeof _id === 'object' && _id ? (_id as { toString(): string }).toString() : String(_id)
    return { ...rest, id } as T
  }

  // Helper: Map _id to id for an array of documents
  private mapDocs<T>(docs: Record<string, unknown>[]): T[] {
    return docs.map(doc => this.mapDoc<T>(doc))
  }

  // Student operations
  async studentFindMany({ select, orderBy, include }: { select?: Record<string, unknown>; orderBy?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<Student[]> {
    const projection = select ? this.mapSelectToProjection(select) : {}
    const sort = orderBy ? this.mapOrderByToSort(orderBy) : {}
    const cursor = this.cols.students.find({}, { projection }).sort(sort)

    if (include?.progress) {
      const students = await cursor.toArray()
      for (const student of students) {
        const progressDocs = await this.cols.labProgress.find({ studentId: student._id.toString() }).toArray()
        student.progress = this.mapDocs(progressDocs)
      }
      return this.mapDocs<Student>(students)
    }

    return this.mapDocs<Student>(await cursor.toArray())
  }

  async studentFindUnique({ where }: { where: { id: string } }): Promise<Student | null> {
    const doc = await this.cols.students.findOne({ _id: this.toObjectId(where.id) })
    return doc ? this.mapDoc<Student>(doc) : null
  }

  // Lab operations
  async labFindMany({ include, orderBy }: { include?: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<Lab[]> {
    const sort = orderBy ? this.mapOrderByToSort(orderBy) : {}
    const labs = await this.cols.labs.find({}).sort(sort).toArray()

    if (include?.flags) {
      for (const lab of labs) {
        const flags = await this.cols.labFlags
          .find({ labId: lab._id.toString() })
          .project({ flagValue: 0 })
          .toArray()
        lab.flags = flags.map((f: { _id: { toString(): string } }) => ({ ...f, id: f._id.toString() }))
      }
    }

    return labs.map((lab: { _id: { toString(): string } }) => ({ ...lab, id: lab._id.toString() })) as unknown as Lab[]
  }

  async labFindUnique({ where, include }: { where: { id: string }; include?: Record<string, unknown> }): Promise<Lab | null> {
    const lab = await this.cols.labs.findOne({ _id: this.toObjectId(where.id) })
    if (!lab) return null

    if (include?.flags) {
      const flags = await this.cols.labFlags.find({ labId: lab._id.toString() }).toArray()
      lab.flags = flags.map((f: { _id: { toString(): string } }) => ({ ...f, id: f._id.toString() }))
    }

    return { ...lab, id: lab._id.toString() } as unknown as Lab
  }

  // LabProgress operations
  async labProgressFindMany({ where, select }: { where: Record<string, unknown>; select?: Record<string, unknown> }): Promise<LabProgress[]> {
    const projection = select ? this.mapSelectToProjection(select) : {}
    const docs = await this.cols.labProgress.find(where, { projection }).toArray()
    return this.mapDocs<LabProgress>(docs)
  }

  async labProgressFindUnique({ where }: { where: { studentId_labId: { studentId: string; labId: string } } }): Promise<LabProgress | null> {
    const { studentId, labId } = where.studentId_labId
    const doc = await this.cols.labProgress.findOne({ studentId, labId })
    return doc ? this.mapDoc<LabProgress>(doc) : null
  }

  async labProgressUpdate({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<LabProgress> {
    await this.cols.labProgress.updateOne(
      { _id: this.toObjectId(where.id) },
      { $set: data }
    )
    const doc = await this.cols.labProgress.findOne({ _id: this.toObjectId(where.id) })
    if (!doc) throw new Error(`LabProgress ${where.id} not found after update`)
    return this.mapDoc<LabProgress>(doc)
  }

  async labProgressCreate({ data }: { data: Record<string, unknown> }): Promise<LabProgress> {
    const result = await this.cols.labProgress.insertOne(data)
    const doc = await this.cols.labProgress.findOne({ _id: result.insertedId })
    if (!doc) throw new Error(`LabProgress not found after create`)
    return this.mapDoc<LabProgress>(doc)
  }

  // LabFlag operations
  async labFlagFindFirst({ where }: { where: Record<string, unknown> }): Promise<LabFlag | null> {
    const doc = await this.cols.labFlags.findOne(where)
    return doc ? this.mapDoc<LabFlag>(doc) : null
  }

  // FlagSubmission operations
  async flagSubmissionFindMany({ where, select, orderBy, take, include }: {
    where?: Record<string, unknown>
    select?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    take?: number
    include?: Record<string, unknown>
  }): Promise<FlagSubmission[]> {
    let query = this.cols.flagSubmissions.find(where || {})

    if (select) query = query.project(this.mapSelectToProjection(select))
    if (orderBy) query = query.sort(this.mapOrderByToSort(orderBy))
    if (take) query = query.limit(take)

    const results = await query.toArray()

    // Resolve includes manually for MongoDB
    if (include) {
      for (const sub of results) {
        if (include.student) {
          const student = await this.cols.students.findOne(
            { _id: this.toObjectId(sub.studentId) },
            { projection: { name: true } }
          )
          sub.student = student
        }
        if (include.lab) {
          const lab = await this.cols.labs.findOne(
            { _id: this.toObjectId(sub.labId) },
            { projection: { title: true } }
          )
          sub.lab = lab
        }
      }
    }

    return results.map((r: { _id: { toString(): string } }) => ({ ...r, id: r._id.toString() })) as unknown as FlagSubmission[]
  }

  async flagSubmissionFindFirst({ where }: { where: Record<string, unknown> }): Promise<FlagSubmission | null> {
    const doc = await this.cols.flagSubmissions.findOne(where)
    return doc ? this.mapDoc<FlagSubmission>(doc) : null
  }

  async flagSubmissionCreate({ data }: { data: Record<string, unknown> }): Promise<FlagSubmission> {
    const result = await this.cols.flagSubmissions.insertOne(data)
    return {
      id: result.insertedId.toString(),
      studentId: data.studentId as string,
      labId: data.labId as string,
      flagKey: data.flagKey as string,
      flagValue: data.flagValue as string,
      correct: data.correct as boolean,
      createdAt: (data.createdAt as Date) || new Date(),
    }
  }

  async flagSubmissionGroupBy({ by: _by, _count: _count }: { by: string[]; _count: boolean }) {
    const pipeline = [
      { $group: { _id: { correct: '$correct' }, count: { $sum: 1 } } },
      { $project: { correct: '$_id.correct', _count: '$count', _id: 0 } }
    ]
    return this.cols.flagSubmissions.aggregate(pipeline).toArray()
  }

  // Article operations
  async articleFindUnique({ where }: { where: { slug: string } }): Promise<Article | null> {
    const article = await this.cols.articles.findOne({ slug: where.slug })
    return article ? { ...article, id: article._id.toString() } as unknown as Article : null
  }

  async articleFindMany({ where, orderBy, skip, take }: {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    skip?: number
    take?: number
  }): Promise<Article[]> {
    let query = this.cols.articles.find(where || {})
    if (orderBy) query = query.sort(this.mapOrderByToSort(orderBy))
    if (skip) query = query.skip(skip)
    if (take) query = query.limit(take)
    return (await query.toArray()).map((a: { _id: { toString(): string } }) => ({ ...a, id: a._id.toString() })) as unknown as Article[]
  }

  async articleCount({ where }: { where?: Record<string, unknown> }): Promise<number> {
    return this.cols.articles.countDocuments(where || {})
  }

  async articleCreate({ data }: { data: Record<string, unknown> }): Promise<Article> {
    const result = await this.cols.articles.insertOne(data)
    return {
      id: result.insertedId.toString(),
      slug: data.slug as string,
      title: data.title as string,
      excerpt: data.excerpt as string,
      content: data.content as string,
      author: data.author as string,
      category: data.category as string,
      tags: (data.tags as string) || '[]',
      coverImage: (data.coverImage as string) || null,
      publishedAt: (data.publishedAt as Date) || new Date(),
      createdAt: (data.createdAt as Date) || new Date(),
      updatedAt: (data.updatedAt as Date) || new Date(),
    }
  }

  // Dashboard aggregation using MongoDB aggregation pipeline
  async getDashboardData(): Promise<DashboardData> {
    const students = await this.cols.students.find({}).toArray()
    const labs = await this.cols.labs.find({}).sort({ order: 1 }).toArray()
    const submissions = await this.cols.flagSubmissions.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    // Resolve student and lab names for submissions
    const recentSubmissions: RecentSubmission[] = []
    for (const sub of submissions) {
      const student = await this.cols.students.findOne({ _id: this.toObjectId(sub.studentId) }, { projection: { name: true } })
      const lab = await this.cols.labs.findOne({ _id: this.toObjectId(sub.labId) }, { projection: { title: true } })
      recentSubmissions.push({
        id: sub._id.toString(),
        studentId: sub.studentId,
        labId: sub.labId,
        studentName: student?.name || 'Unknown',
        labTitle: lab?.title || 'Unknown',
        flagKey: sub.flagKey,
        correct: sub.correct,
        createdAt: sub.createdAt,
      })
    }

    // Submission stats
    const submissionStats = await this.flagSubmissionGroupBy({ by: ['correct'], _count: true })
    const totalSubmissions = submissionStats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0)
    const correctSubmissions = submissionStats.find((s: { correct: boolean; _count: number }) => s.correct)?._count || 0

    // Student stats
    const studentStats = await Promise.all(students.map(async (student: { _id: { toString(): string }; name: string; group: string }) => {
      const progress = await this.cols.labProgress.find({ studentId: student._id.toString() }).toArray()
      const totalScore = progress.reduce((sum: number, p: { score?: number }) => sum + (p.score || 0), 0)
      const completedLabs = progress.filter((p: { status?: string }) => p.status === 'completed').length
      const inProgressLabs = progress.filter((p: { status?: string }) => p.status === 'in_progress').length
      return {
        id: student._id.toString(),
        name: student.name,
        group: student.group,
        totalScore,
        completedLabs,
        inProgressLabs,
        totalLabs: labs.length,
      }
    }))
    studentStats.sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore)

    // Lab stats
    const labStatsPromises = labs.map(async (lab: { _id: { toString(): string }; number: number; title: string; difficulty: string }) => {
      const studentIds = students.map((s: { _id: { toString(): string } }) => s._id.toString())
      let completed = 0
      let inProgress = 0
      for (const sid of studentIds) {
        const p = await this.cols.labProgress.findOne({ studentId: sid, labId: lab._id.toString() })
        if (p?.status === 'completed') completed++
        else if (p?.status === 'in_progress') inProgress++
      }
      return {
        id: lab._id.toString(),
        number: lab.number,
        title: lab.title,
        difficulty: lab.difficulty,
        completed,
        inProgress,
        totalStudents: students.length,
      }
    })
    const labStats = await Promise.all(labStatsPromises)

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

  // MongoDB transactions (requires replica set)
  async transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const session = this.client.startSession()
    try {
      return await session.withTransaction(async () => {
        const txCols: Collections = {
          students: this.cols.students.withSession(session),
          labs: this.cols.labs.withSession(session),
          labFlags: this.cols.labFlags.withSession(session),
          labProgress: this.cols.labProgress.withSession(session),
          flagSubmissions: this.cols.flagSubmissions.withSession(session),
          articles: this.cols.articles.withSession(session),
        }

        return fn({
          flagSubmission: {
            findFirst: async (args: { where: Record<string, unknown> }) => {
              const doc = await txCols.flagSubmissions.findOne(args.where)
              return doc ? { ...doc, id: doc._id.toString() } : null
            },
            create: async (args: { data: Record<string, unknown> }) => {
              const result = await txCols.flagSubmissions.insertOne(args.data)
              return { ...args.data, id: result.insertedId.toString() }
            },
            findMany: async (args: { where: Record<string, unknown> }) => {
              const results = await txCols.flagSubmissions.find(args.where).toArray()
              return results.map((r: { _id: { toString(): string } }) => ({ ...r, id: r._id.toString() }))
            },
          },
          labFlag: {
            findFirst: async (args: { where: Record<string, unknown> }) => {
              const doc = await txCols.labFlags.findOne(args.where)
              return doc ? { ...doc, id: doc._id.toString() } : null
            },
          },
          labProgress: {
            findUnique: async (args: { where: { studentId_labId: { studentId: string; labId: string } } }) => {
              const { studentId, labId } = args.where.studentId_labId
              const doc = await txCols.labProgress.findOne({ studentId, labId })
              return doc ? { ...doc, id: doc._id.toString() } : null
            },
            update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
              const result = await txCols.labProgress.updateOne(
                { _id: this.toObjectId(args.where.id) },
                { $set: args.data }
              )
              if (result.matchedCount === 0) {
                throw new Error(`LabProgress not found: ${args.where.id}`)
              }
              const doc = await txCols.labProgress.findOne({ _id: this.toObjectId(args.where.id) })
              if (!doc) {
                throw new Error(`LabProgress document disappeared after update: ${args.where.id}`)
              }
              return { ...doc, id: doc._id.toString() }
            },
            create: async (args: { data: Record<string, unknown> }) => {
              const result = await txCols.labProgress.insertOne(args.data)
              const doc = await txCols.labProgress.findOne({ _id: result.insertedId })
              return doc ? { ...doc, id: doc._id.toString() } : null
            },
          },
          lab: {
            findUnique: async (args: { where: { id: string }; include?: { flags?: boolean } }) => {
              const lab = await txCols.labs.findOne({ _id: this.toObjectId(args.where.id) })
              if (!lab) return null
              if (args.include?.flags) {
                const flags = await txCols.labFlags
                  .find({ labId: lab._id.toString() })
                  .project({ flagValue: 0 })
                  .toArray()
                lab.flags = flags.map((f: { _id: { toString(): string } }) => ({ ...f, id: f._id.toString() }))
              }
              return { ...lab, id: lab._id.toString() }
            },
          },
        } as unknown as TransactionContext)
      })
    } finally {
      await session.endSession()
    }
  }

  // Expose raw client for MongoDB-specific seed scripts
  override get rawClient(): MongoClient {
    return this.client
  }
}
