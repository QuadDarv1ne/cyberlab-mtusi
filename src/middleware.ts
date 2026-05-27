import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Set a persistent client ID cookie + header if missing (required for anonymous rate limiting)
  const cookieHeader = request.headers.get('cookie') ?? ''
  let clientId: string | null = null
  const match = cookieHeader.match(/(?:^|;\s*)clid=([^;]+)/)
  if (match) {
    clientId = match[1]
  } else {
    clientId = crypto.randomUUID()
  }

  // Forward client ID via request header so API handlers can use it immediately
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-client-id', clientId)
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Set persistent cookie for subsequent requests
  if (!match) {
    response.cookies.set('clid', clientId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '0') // Modern browsers use CSP instead
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy - 'strict-dynamic' enables hash/nonce-based verification while
  // 'unsafe-inline' provides fallback for Next.js Hydration (required by the framework)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  )

  // HSTS (only in production, over HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
