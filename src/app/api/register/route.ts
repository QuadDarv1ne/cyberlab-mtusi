import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { withErrorHandling } from '@/lib/api-helpers'

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100),
  email: z.string().email('Неверный формат email'),
  password: z
    .string()
    .min(10, 'Минимум 10 символов')
    .max(100)
    .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .regex(/[a-z]/, 'Нужна хотя бы одна строчная буква')
    .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
    .regex(/[^A-Za-z0-9]/, 'Нужен хотя бы один специальный символ (!@#$%^&* и т.д.)'),
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

    const body = await req.json()
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

    await db.userCreate({
      data: { name, email, passwordHash, role: 'STUDENT', emailVerified: null }
    })

    return NextResponse.json({ success: true }, { headers })
  }, 'POST /api/register')
}
