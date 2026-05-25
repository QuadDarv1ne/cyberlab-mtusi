import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

const articleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().min(1, 'Excerpt is required').max(500),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().optional().default('[]'),
  coverImage: z.string().optional(),
})

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    // Rate limit: 60 requests per minute per IP for read-only articles
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`articles:${clientIp}`, { maxRequests: 60 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }
    const slug = searchParams.get('slug')

    if (slug) {
      const article = await db.article.findUnique({ where: { slug } })
      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      return NextResponse.json(article)
    }

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const total = await db.article.count({ where })
    const articles = await db.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return cachedJson({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { maxAge: 120, staleWhileRevalidate: 600 })
  }, 'GET /api/articles')
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    // Rate limit: 5 article creations per minute per IP
    const clientIp = getClientIp(req)
    const rate = checkRateLimit(`articles-post:${clientIp}`, { maxRequests: 5 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток создания статей. Подождите.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = articleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }

    // Basic XSS sanitization - strip script tags and event handlers from content
    const sanitizedData = {
      ...parsed.data,
      title: parsed.data.title.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ''),
      excerpt: parsed.data.excerpt.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ''),
      content: parsed.data.content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, ''),
    }

    const existing = await db.article.findUnique({ where: { slug: sanitizedData.slug } })
    if (existing) {
      return NextResponse.json({ error: 'Article with this slug already exists' }, { status: 409 })
    }

    const article = await db.article.create({ data: sanitizedData })
    return NextResponse.json(article, { status: 201 })
  }, 'POST /api/articles')
}
