import type { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
    studentId?: string | null
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
      studentId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: Role
    studentId: string | null
  }
}
