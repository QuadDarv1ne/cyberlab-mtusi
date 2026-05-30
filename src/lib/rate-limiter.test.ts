import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

describe('rate-limiter', () => {
  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Reset rate limits between tests by creating a fresh module instance
      vi.resetModules()
    })

    it('should allow first request for a new identifier', () => {
      const result = checkRateLimit('test-user', { maxRequests: 5 })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should block requests after exceeding limit', () => {
      const identifier = 'rate-limit-test'
      const options = { maxRequests: 3 }

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(identifier, options)
        expect(result.allowed).toBe(true)
      }

      // Next request should be blocked
      const result = checkRateLimit(identifier, options)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter != null && result.retryAfter > 0).toBe(true)
    })

    it('should reset after window expires', async () => {
      const identifier = 'window-test'
      const windowMs = 100 // Very short window for testing
      const options = { maxRequests: 2, windowMs }

      // Use up the limit
      checkRateLimit(identifier, options)
      checkRateLimit(identifier, options)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, windowMs + 50))

      // Should be allowed again
      const result = checkRateLimit(identifier, options)
      expect(result.allowed).toBe(true)
    })

    it('should track different identifiers independently', () => {
      const result1 = checkRateLimit('user-1', { maxRequests: 1 })
      const result2 = checkRateLimit('user-2', { maxRequests: 1 })

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)

      // user-1 should now be blocked
      const result1Again = checkRateLimit('user-1', { maxRequests: 1 })
      expect(result1Again.allowed).toBe(false)

      // user-2 should still be allowed
      expect(result2.allowed).toBe(true)
    })
  })

  describe('getClientIp', () => {
    it('should use x-forwarded-for header when available (production)', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      })
      expect(getClientIp(request)).toBe('192.168.1.1')
      process.env.NODE_ENV = originalEnv
    })

    it('should use x-real-ip header when x-forwarded-for is not available (production)', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '203.0.113.1' }
      })
      expect(getClientIp(request)).toBe('203.0.113.1')
      process.env.NODE_ENV = originalEnv
    })

    it('should use x-client-id header from middleware', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-client-id': 'test-client-uuid' }
      })
      expect(getClientIp(request)).toBe('anon:test-client-uuid')
    })

    it('should extract clid from cookie when headers not available', () => {
      const request = new Request('http://localhost', {
        headers: { 'cookie': 'clid=cookie-value; other=data' }
      })
      expect(getClientIp(request)).toBe('anon:cookie-value')
    })

    it('should use fixed fallback when no identity is available', () => {
      const request = new Request('http://localhost')
      const ip = getClientIp(request)
      // Should use constant fallback, not random UUID
      expect(ip).toBe('anon:unknown')
      // Verify it's consistent across calls
      const ip2 = getClientIp(new Request('http://localhost'))
      expect(ip2).toBe('anon:unknown')
    })
  })
})
