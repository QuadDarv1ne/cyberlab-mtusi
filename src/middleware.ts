import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

const protectedApiRoutes = ['/api/flags', '/api/articles']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Auth check for protected API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const isProtected = protectedApiRoutes.some(
      route => pathname === route || pathname.startsWith(route + '/')
    )
    if (isProtected) {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Требуется авторизация' },
          { status: 401 }
        )
      }
      // Forward user info via headers for API handlers
      requestHeaders.set('x-user-id', session.user.id)
      requestHeaders.set('x-user-role', String(session.user.role))
      requestHeaders.set('x-user-student-id', session.user.studentId ?? '')
    }
  }

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
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  )

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
