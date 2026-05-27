import { timingSafeEqual } from 'crypto'

/**
 * Timing-safe string comparison to prevent timing oracle attacks.
 * Uses Node.js crypto.timingSafeEqual which compares bytes in constant time
 * regardless of where strings differ, preventing length-based timing leaks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}
