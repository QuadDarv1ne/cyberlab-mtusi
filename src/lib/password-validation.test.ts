import { describe, it, expect } from 'vitest'
import { passwordSchema, validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/lib/password-validation'

const VALID_PASSWORD = 'Str0ng!Pass'

describe('password-validation', () => {
  describe('validatePassword', () => {
    it('should return null for a valid password', () => {
      expect(validatePassword(VALID_PASSWORD)).toBeNull()
    })

    it('should reject passwords shorter than minimum length', () => {
      const result = validatePassword('Sh0rt!1')
      expect(result).toContain('Минимум 10 символов')
    })

    it('should reject passwords longer than maximum length', () => {
      const longPassword = 'A'.repeat(PASSWORD_MAX_LENGTH + 1) + '1!'
      const result = validatePassword(longPassword)
      expect(result).toContain('Максимум 100 символов')
    })

    it('should reject passwords without uppercase letter', () => {
      const result = validatePassword('str0ng!pass')
      expect(result).toContain('заглавная')
    })

    it('should reject passwords without lowercase letter', () => {
      const result = validatePassword('STR0NG!PASS')
      expect(result).toContain('строчная')
    })

    it('should reject passwords without a digit', () => {
      const result = validatePassword('Strong!Pass')
      expect(result).toContain('цифра')
    })

    it('should reject passwords without a special character', () => {
      const result = validatePassword('StrongPass1')
      expect(result).toContain('специальный')
    })

    it('should return only the first validation error', () => {
      // Empty string triggers min length error first
      const result = validatePassword('')
      expect(result).toBe('Минимум 10 символов')
    })

    it('should accept password at exact minimum length', () => {
      expect(validatePassword('Abcdefg1!x')).toBeNull()
    })

    it('should accept password with various special characters', () => {
      expect(validatePassword('Test1234@x')).toBeNull()
      expect(validatePassword('Test1234#x')).toBeNull()
      expect(validatePassword('Test1234%x')).toBeNull()
      expect(validatePassword('Test1234&x')).toBeNull()
      expect(validatePassword('Test1234*x')).toBeNull()
    })
  })

  describe('passwordSchema (direct zod usage)', () => {
    it('should parse a valid password successfully', () => {
      const result = passwordSchema.safeParse(VALID_PASSWORD)
      expect(result.success).toBe(true)
    })

    it('should fail parsing for a weak password', () => {
      const result = passwordSchema.safeParse('weak')
      expect(result.success).toBe(false)
    })
  })

  describe('constants', () => {
    it('should export PASSWORD_MIN_LENGTH as 10', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(10)
    })

    it('should export PASSWORD_MAX_LENGTH as 100', () => {
      expect(PASSWORD_MAX_LENGTH).toBe(100)
    })
  })
})
