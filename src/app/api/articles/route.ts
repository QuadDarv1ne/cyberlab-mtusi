import { db } from '@/lib/db'
import { cachedJson, withErrorHandling } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import sanitize from 'sanitize-html'

const articleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().min(1, 'Excerpt is required').max(500),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
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
    if (Number.isNaN(page) || Number.isNaN(limit) || page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }
    const slug = searchParams.get('slug')

    if (slug) {
      const article = await db.articleFindUnique({ where: { slug } })
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

    const total = await db.articleCount({ where })
    const articles = await db.articleFindMany({
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

// XSS protection using sanitize-html library
function sanitizeHtml(input: string): string {
  return sanitize(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
  })
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    // Auth: require admin role
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

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

    // XSS sanitization - strip all HTML and dangerous protocols
    const sanitizedData = {
      ...parsed.data,
      title: sanitizeHtml(parsed.data.title),
      excerpt: sanitizeHtml(parsed.data.excerpt),
      content: sanitizeHtml(parsed.data.content),
      author: sanitizeHtml(parsed.data.author),
      category: sanitizeHtml(parsed.data.category),
      tags: JSON.stringify(parsed.data.tags),
    }

    const existing = await db.articleFindUnique({ where: { slug: sanitizedData.slug } })
    if (existing) {
      return NextResponse.json({ error: 'Article with this slug already exists' }, { status: 409 })
    }

    const article = await db.articleCreate({ data: sanitizedData })
    return NextResponse.json(article, { status: 201 })
  }, 'POST /api/articles')
}
