/**
 * Database-backed password reset token store.
 * Tokens persist across server restarts and support horizontal scaling.
 */

import { db } from '@/lib/db'

const RESET_TOKEN_TTL_MS = 3600000 // 1 hour

export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  // Clean up expired tokens on each creation
  await db.passwordResetTokenCleanup()

  await db.passwordResetTokenCreate({
    data: { token, userId, expiresAt }
  })

  return token
}

export async function consumeResetToken(token: string): Promise<{ userId: string } | null> {
  return db.passwordResetTokenConsume({ where: { token } })
}
