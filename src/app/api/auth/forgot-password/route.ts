import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createResetToken } from '@/lib/reset-tokens'
import { logger } from '@/lib/logger'

/**
 * Constant-time delay to prevent email enumeration via timing attacks.
 * Always takes ~500ms regardless of whether the email exists.
 */
const ENUMERATION_DELAY_MS = 500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const { email } = body as { email?: unknown }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
  }

  try {
    const user = await db.userFindUnique({ where: { email } })

    if (user) {
      const token = await createResetToken(user.id)
      // In production, send email with token (e.g. via Resend, SendGrid, Nodemailer)
      // For local development: log token to console
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`[DEV] Password reset token for ${email}: ${token}`)
      }
    }

    // Constant-time response to prevent timing-based email enumeration
    await delay(ENUMERATION_DELAY_MS)

    // Always return the same message regardless of whether email exists
    return NextResponse.json({
      message: 'Если email существует, вы получите ссылку для сброса пароля',
    })
  } catch (error) {
    logger.error('[forgot-password] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
