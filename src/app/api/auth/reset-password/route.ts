import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { consumeResetToken } from '@/lib/reset-tokens'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
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

  if (password.length < 10) {
    return NextResponse.json({ error: 'Минимум 10 символов' }, { status: 400 })
  }

  if (password.length > 100) {
    return NextResponse.json({ error: 'Максимум 100 символов' }, { status: 400 })
  }

  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: 'Нужна хотя бы одна заглавная буква' }, { status: 400 })
  }

  if (!/[a-z]/.test(password)) {
    return NextResponse.json({ error: 'Нужна хотя бы одна строчная буква' }, { status: 400 })
  }

  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Нужна хотя бы одна цифра' }, { status: 400 })
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return NextResponse.json({ error: 'Нужен хотя бы один специальный символ' }, { status: 400 })
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
