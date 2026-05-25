import { NextResponse } from 'next/server'

/**
 * Wraps an async API route handler with centralized error handling.
 * Catches unhandled exceptions and returns a standardized 500 response.
 * Sanitizes error messages to prevent information leakage.
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse<unknown>>,
  routeName: string
): Promise<NextResponse<unknown>> {
  try {
    return await handler()
  } catch (error) {
    // Sanitize error logging - don't log full error objects that may contain sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API ${routeName}] Error: ${errorMessage}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Creates a JSON response with standard cache headers.
 * Uses private caching to prevent data leakage between users via shared caches.
 */
export function cachedJson<T>(
  data: T,
  options: {
    maxAge?: number
    staleWhileRevalidate?: number
    status?: number
  } = {}
): NextResponse<T> {
  const {
    maxAge = 60,
    staleWhileRevalidate = 300,
    status = 200,
  } = options

  const response = NextResponse.json(data, { status })
  response.headers.set(
    'Cache-Control',
    `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  response.headers.set('Vary', 'Accept-Encoding')
  return response
}
