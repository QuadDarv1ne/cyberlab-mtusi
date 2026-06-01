import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { consumeResetToken } from '@/lib/reset-tokens'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { validatePassword } from '@/lib/password-validation'

export async function POST(req: Request) {
  // Rate limit: 5 reset attempts per IP per 15 minutes to prevent token brute-forcing
  const clientIp = getClientIp(req)
  const rate = checkRateLimit(`reset-password:${clientIp}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 })
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте позже' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const { token, password } = body as { token?: unknown; password?: unknown }

  if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Токен и пароль обязательны' }, { status: 400 })
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  try {
    const resetData = await consumeResetToken(token)
    if (!resetData) {
      return NextResponse.json({ error: 'Неверный или просроченный токен' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await db.userUpdate({
      where: { id: resetData.userId },
      data: { passwordHash }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[reset-password] Reset password error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
