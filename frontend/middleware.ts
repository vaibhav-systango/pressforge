import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GUEST_ONLY_AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/accept-invite'];

const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isPublicApi && !accessToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'TOKEN_MISSING' },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (GUEST_ONLY_AUTH_PATHS.includes(pathname) && accessToken) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  if (pathname.startsWith('/app') || pathname.startsWith('/onboarding')) {
    if (!accessToken) {
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
