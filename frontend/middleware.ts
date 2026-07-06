import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GUEST_ONLY_AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/accept-invite'];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/session/init',
];

const SESSION_COOKIE = 'pf_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.get(SESSION_COOKIE)?.value === '1' ||
    !!request.cookies.get('access_token')?.value;

  if (pathname.startsWith('/api/')) {
    const isPublicApi =
      PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
      (pathname === '/api/clients' && request.method === 'POST');
    if (!isPublicApi && !hasSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'TOKEN_MISSING' },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (GUEST_ONLY_AUTH_PATHS.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  if (pathname.startsWith('/app') || pathname.startsWith('/onboarding')) {
    if (!hasSession) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
    '/onboarding/:path*',
    '/api/:path*',
    '/auth/login',
    '/auth/signup',
    '/auth/accept-invite',
  ],
};
