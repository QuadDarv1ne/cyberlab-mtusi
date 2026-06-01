import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { withErrorHandling } from '@/lib/api-helpers'
import { passwordSchema } from '@/lib/password-validation'

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100),
  email: z.string().email('Неверный формат email'),
  password: passwordSchema,
})

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60_000 })

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    }

    if (rateLimit.retryAfter) {
      headers['Retry-After'] = String(rateLimit.retryAfter)
    }

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток регистрации. Попробуйте позже' },
        { status: 429, headers }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Неверный формат запроса' },
        { status: 400, headers }
      )
    }
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Неверный запрос' },
        { status: 400, headers }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await db.userFindUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409, headers }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const student = await db.studentCreate({
      data: { name, group: 'Новая группа', createdAt: new Date() }
    })

    await db.userCreate({
      data: { name, email, passwordHash, role: 'STUDENT', studentId: student.id, emailVerified: null }
    })

    return NextResponse.json({ success: true }, { headers })
  }, 'POST /api/register')
}
