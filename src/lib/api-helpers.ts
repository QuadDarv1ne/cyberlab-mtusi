import { NextResponse } from 'next/server'

/**
 * Wraps an async API route handler with centralized error handling.
 * Catches unhandled exceptions and returns a standardized 500 response.
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse<unknown>>,
  routeName: string
): Promise<NextResponse<unknown>> {
  try {
    return await handler()
  } catch (error) {
    console.error(`[API ${routeName}] Error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Creates a JSON response with standard cache headers.
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
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  return response
}
