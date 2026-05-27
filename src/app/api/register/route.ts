import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100),
  email: z.string().email('Неверный формат email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .max(100)
    .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .regex(/[a-z]/, 'Нужна хотя бы одна строчная буква')
    .regex(/[0-9]/, 'Нужна хотя бы одна цифра'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Неверный запрос' },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await db.userFindUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.userCreate({
      data: { name, email, passwordHash, role: 'STUDENT' }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
