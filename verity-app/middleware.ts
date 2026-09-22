import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // 1. WWW Canonicalization (HTTP 301 Permanent Redirect)
  if (host.startsWith('www.')) {
    const nonWwwHost = host.replace(/^www\./, '')
    const canonicalUrl = new URL(request.url)
    canonicalUrl.host = nonWwwHost
    canonicalUrl.protocol = 'https'
    return NextResponse.redirect(canonicalUrl, { status: 301 })
  }

  // 2. Check for session authentication cookie
  const veritySession = request.cookies.get('verity_session')?.value
  const hasSupabaseCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  const isAuthenticated = Boolean(veritySession || hasSupabaseCookie)

  // 3. Protect /dashboard routes — without signup / account, users cannot access
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 4. Redirect authenticated users away from /login and /signup
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.searchParams.delete('redirect')
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
}
