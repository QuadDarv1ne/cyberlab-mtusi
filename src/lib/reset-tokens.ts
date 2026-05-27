/**
 * In-memory store for password reset tokens.
 * Each token maps to a user ID and expiration timestamp.
 *
 * Note: In production, replace with Redis or database-backed storage
 * to support horizontal scaling and persistence across restarts.
 */

interface ResetTokenEntry {
  userId: string
  expires: number
}

const resetTokens = new Map<string, ResetTokenEntry>()

export function createResetToken(userId: string, ttlMs: number = 3600000): string {
  const token = crypto.randomUUID()
  resetTokens.set(token, { userId, expires: Date.now() + ttlMs })

  // Cleanup expired tokens on each creation
  for (const [key, entry] of resetTokens) {
    if (entry.expires < Date.now()) {
      resetTokens.delete(key)
    }
  }

  return token
}

export function consumeResetToken(token: string): { userId: string } | null {
  const entry = resetTokens.get(token)
  if (!entry) return null

  if (entry.expires < Date.now()) {
    resetTokens.delete(token)
    return null
  }

  resetTokens.delete(token)
  return { userId: entry.userId }
}
