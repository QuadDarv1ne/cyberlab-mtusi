import { createHash, timingSafeEqual } from 'crypto'

/**
 * Timing-safe string comparison to prevent timing oracle attacks.
 * Hashes both inputs with SHA-256 before comparison, ensuring the
 * comparison always runs on fixed-length (32-byte) digests. This
 * prevents attackers from inferring correct flag length via timing.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const aHash = createHash('sha256').update(a, 'utf8').digest()
  const bHash = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(aHash, bHash)
}
