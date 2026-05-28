import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { consumeResetToken } from '@/lib/reset-tokens'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Токен и пароль обязательны' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Минимум 8 символов' }, { status: 400 })
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

    const resetData = consumeResetToken(token)
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
    console.error('[reset-password] Reset password error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
