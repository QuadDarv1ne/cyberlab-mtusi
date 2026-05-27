import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createResetToken } from '@/lib/reset-tokens'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const user = await db.userFindUnique({ where: { email } })
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ message: 'Если email существует, токен будет создан' })
    }

    const token = createResetToken(user.id)

    // In production: send email with token
    // For now: return token directly (mock)
    return NextResponse.json({
      message: 'Токен создан',
      token,
    })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
