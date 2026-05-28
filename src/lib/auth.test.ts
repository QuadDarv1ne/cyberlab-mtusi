import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

describe('Password hashing with bcrypt', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'TestPassword123!'
    const hash = await bcrypt.hash(password, 12)

    expect(hash).not.toBe(password)
    expect(hash).toContain('$2') // bcrypt prefix

    const isValid = await bcrypt.compare(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const password = 'CorrectPassword1!'
    const hash = await bcrypt.hash(password, 12)

    const isValid = await bcrypt.compare('WrongPassword!', hash)
    expect(isValid).toBe(false)
  })

  it('should produce different hashes for same password', async () => {
    const password = 'SamePassword1!'
    const hash1 = await bcrypt.hash(password, 12)
    const hash2 = await bcrypt.hash(password, 12)

    expect(hash1).not.toBe(hash2) // Different salts

    // But both should verify
    expect(await bcrypt.compare(password, hash1)).toBe(true)
    expect(await bcrypt.compare(password, hash2)).toBe(true)
  })

  it('should use correct salt rounds', async () => {
    const password = 'Test123!'
    const hash = await bcrypt.hash(password, 12)

    const rounds = parseInt(hash.split('$')[2], 10)
    expect(rounds).toBe(12)
  })
})
