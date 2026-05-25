import { MongoClient, ObjectId } from 'mongodb'
import { DatabaseAdapter, DbType } from './base'
import type { TransactionContext, DashboardData, LabProgress, FlagSubmission } from '../types'

interface Collections {
  students: any
  labs: any
  labFlags: any
  labProgress: any
  flagSubmissions: any
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
  private toObjectId(id: string): ObjectId {
    return ObjectId.isValid(id) ? new ObjectId(id) : id as any
  }

  // Student operations
  async studentFindMany({ select, orderBy, include }: { select?: Record<string, unknown>; orderBy?: Record<string, unknown>; include?: Record<string, unknown> }) {
    const projection = select ? this.mapSelectToProjection(select) : {}
    const sort = orderBy ? this.mapOrderByToSort(orderBy) : {}
    const cursor = this.cols.students.find({}, { projection }).sort(sort)

    if (include?.progress) {
      const students = await cursor.toArray()
      for (const student of students) {
        student.progress = await this.cols.labProgress.find({ studentId: student._id.toString() }).toArray()
      }
      return students
    }

    return cursor.toArray()
  }

  async studentFindUnique({ where }: { where: { id: string } }) {
    return this.cols.students.findOne({ _id: this.toObjectId(where.id) })
  }

  // Lab operations
  async labFindMany({ include, orderBy }: { include?: Record<string, unknown>; orderBy?: Record<string, unknown> }) {
    const sort = orderBy ? this.mapOrderByToSort(orderBy) : {}
    const labs = await this.cols.labs.find({}).sort(sort).toArray()

    if (include?.flags) {
      for (const lab of labs) {
        const flags = await this.cols.labFlags
          .find({ labId: lab._id.toString() })
          .project({ flagValue: 0 })
          .toArray()
        lab.flags = flags.map((f: any) => ({ ...f, id: f._id.toString() }))
      }
    }

    return labs.map((lab: any) => ({ ...lab, id: lab._id.toString() }))
  }

  async labFindUnique({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) {
    const lab = await this.cols.labs.findOne({ _id: this.toObjectId(where.id) })
    if (!lab) return null

    if (include?.flags) {
      const flags = await this.cols.labFlags.find({ labId: lab._id.toString() }).toArray()
      lab.flags = flags.map((f: any) => ({ ...f, id: f._id.toString() }))
    }

    return { ...lab, id: lab._id.toString() }
  }

  // LabProgress operations
  async labProgressFindMany({ where, select }: { where: Record<string, unknown>; select?: Record<string, unknown> }) {
    const projection = select ? this.mapSelectToProjection(select) : {}
    return this.cols.labProgress.find(where, { projection }).toArray()
  }

  async labProgressFindUnique({ where }: { where: { studentId_labId: { studentId: string; labId: string } } }) {
    const { studentId, labId } = where.studentId_labId
    return this.cols.labProgress.findOne({ studentId, labId })
  }

  async labProgressUpdate({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
    await this.cols.labProgress.updateOne(
      { _id: this.toObjectId(where.id) },
      { $set: data }
    )
    return this.cols.labProgress.findOne({ _id: this.toObjectId(where.id) })
  }

  async labProgressCreate({ data }: { data: Record<string, unknown> }) {
    const result = await this.cols.labProgress.insertOne(data as any)
    return this.cols.labProgress.findOne({ _id: result.insertedId })
  }

  // LabFlag operations
  async labFlagFindFirst({ where }: { where: Record<string, unknown> }) {
    return this.cols.labFlags.findOne(where)
  }

  // FlagSubmission operations
  async flagSubmissionFindMany({ where, select, orderBy, take, include }: {
    where?: Record<string, unknown>
    select?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    take?: number
    include?: Record<string, unknown>
  }) {
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

    return results.map((r: any) => ({ ...r, id: r._id.toString() }))
  }

  async flagSubmissionFindFirst({ where }: { where: Record<string, unknown> }) {
    return this.cols.flagSubmissions.findOne(where)
  }

  async flagSubmissionCreate({ data }: { data: Record<string, unknown> }) {
    const result = await this.cols.flagSubmissions.insertOne(data as any)
    return { ...(data as any), id: result.insertedId.toString() }
  }

  async flagSubmissionGroupBy({ by: _by, _count: _count }: { by: string[]; _count: boolean }) {
    const pipeline = [
      { $group: { _id: { correct: '$correct' }, count: { $sum: 1 } } },
      { $project: { correct: '$_id.correct', _count: '$count', _id: 0 } }
    ]
    return this.cols.flagSubmissions.aggregate(pipeline).toArray()
  }

  // Article operations
  async articleFindUnique({ where }: { where: { slug: string } }) {
    const article = await this.cols.articles.findOne({ slug: where.slug })
    return article ? { ...article, id: article._id.toString() } : null
  }

  async articleFindMany({ where, orderBy, skip, take }: {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    skip?: number
    take?: number
  }) {
    let query = this.cols.articles.find(where || {})
    if (orderBy) query = query.sort(this.mapOrderByToSort(orderBy))
    if (skip) query = query.skip(skip)
    if (take) query = query.limit(take)
    return (await query.toArray()).map((a: any) => ({ ...a, id: a._id.toString() }))
  }

  async articleCount({ where }: { where?: Record<string, unknown> }) {
    return this.cols.articles.countDocuments(where || {})
  }

  async articleCreate({ data }: { data: Record<string, unknown> }) {
    const result = await this.cols.articles.insertOne(data as any)
    return { ...(data as any), id: result.insertedId.toString() }
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
    const recentSubmissions: any[] = []
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
    const totalSubmissions = submissionStats.reduce((sum: number, s: any) => sum + s._count, 0)
    const correctSubmissions = submissionStats.find((s: any) => s.correct)?._count || 0

    // Student stats
    const studentStats = await Promise.all(students.map(async (student: any) => {
      const progress = await this.cols.labProgress.find({ studentId: student._id.toString() }).toArray()
      const totalScore = progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0)
      const completedLabs = progress.filter((p: any) => p.status === 'completed').length
      const inProgressLabs = progress.filter((p: any) => p.status === 'in_progress').length
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
    studentStats.sort((a: any, b: any) => b.totalScore - a.totalScore)

    // Lab stats (sequential due to MongoDB async nature)
    const labStatsPromises = labs.map(async (lab: any) => {
      const studentIds = students.map((s: any) => s._id.toString())
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
            findFirst: (args: any) => txCols.flagSubmissions.findOne(args.where),
            create: async (args: any) => {
              const result = await txCols.flagSubmissions.insertOne(args.data)
              return { ...args.data, id: result.insertedId.toString() }
            },
            findMany: async (args: any) => {
              const results = await txCols.flagSubmissions.find(args.where).toArray()
              return results.map((r: any) => ({ ...r, id: r._id.toString() }))
            },
          },
          labFlag: {
            findFirst: (args: any) => txCols.labFlags.findOne(args.where),
          },
          labProgress: {
            findUnique: (args: any) => {
              const { studentId, labId } = args.where.studentId_labId
              return txCols.labProgress.findOne({ studentId, labId })
            },
            update: async (args: any) => {
              await txCols.labProgress.updateOne(
                { _id: this.toObjectId(args.where.id) },
                { $set: args.data }
              )
              return txCols.labProgress.findOne({ _id: this.toObjectId(args.where.id) })
            },
            create: async (args: any) => {
              const result = await txCols.labProgress.insertOne(args.data)
              return txCols.labProgress.findOne({ _id: result.insertedId })
            },
          },
          lab: {
            findUnique: async (args: any) => {
              const lab = await txCols.labs.findOne({ _id: this.toObjectId(args.where.id) })
              return lab ? { ...lab, id: lab._id.toString() } : null
            },
          },
        } as unknown as TransactionContext)
      })
    } finally {
      await session.endSession()
    }
  }
}
