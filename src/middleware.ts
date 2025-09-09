import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    const origin = request.headers.get('origin') || ''
    const allowedOrigins = [
      'https://documind.web.id',
      'https://www.documind.web.id',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ]
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    response.headers.set('Access-Control-Allow-Origin', corsOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }

    return response
  }

  // Protected routes logic
  if (
    request.nextUrl.pathname.startsWith('/_next') || // Exclude Next.js system routes
    request.nextUrl.pathname.startsWith('/api/') || // Exclude API routes
    request.nextUrl.pathname.startsWith('/signin') || // Exclude sign-in page
    request.nextUrl.pathname.startsWith('/signup') // Exclude sign-up page
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Redirect to login if not authenticated and trying to access protected routes
  if (!token) {
    const url = new URL('/signin', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /static (inside /public)
     * 3. /_vercel (Vercel internals)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 