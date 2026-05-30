import { describe, it, expect, vi } from 'vitest'
import { withErrorHandling, cachedJson } from './api-helpers'
import { NextResponse } from 'next/server'
import { logger } from './logger'

// Mock logger to prevent console output during tests
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('withErrorHandling', () => {
  it('should return handler response on success', async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ test: true })
    )

    const result = await withErrorHandling(handler, 'test-route')
    expect(result.status).toBe(200)
  })

  it('should return 500 response on error', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Test error'))

    const result = await withErrorHandling(handler, 'test-route')
    expect(result.status).toBe(500)

    const json = await result.json()
    expect(json).toEqual({ error: 'Internal server error' })
  })

  it('should log error via logger', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Test error'))

    await withErrorHandling(handler, 'test-route')

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('test-route')
    )
  })
})

describe('cachedJson', () => {
  it('should return JSON response with cache headers', async () => {
    const data = { foo: 'bar' }
    const response = cachedJson(data)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(data)
    expect(response.headers.get('Cache-Control')).toContain('max-age=60')
    expect(response.headers.get('Vary')).toBe('Accept-Encoding')
  })

  it('should respect custom cache options', async () => {
    const response = cachedJson({}, { maxAge: 120, staleWhileRevalidate: 60 })

    expect(response.headers.get('Cache-Control')).toContain('max-age=120')
    expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=60')
  })

  it('should respect custom status code', async () => {
    const response = cachedJson({}, { status: 201 })
    expect(response.status).toBe(201)
  })
})
