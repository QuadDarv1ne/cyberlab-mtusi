import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Role } from '@prisma/client'

export interface AuthContext {
  userId: string
  name: string
  email: string
  role: Role
  studentId: string | null
}

export async function requireAuth(): Promise<NextResponse<{ error: string }> | AuthContext> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    studentId: session.user.studentId,
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<NextResponse | AuthContext | null> {
  const result = await requireAuth()
  if ('status' in result) return result

  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
  }
  return result
}
