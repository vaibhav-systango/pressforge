import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH } from '@/constants';
import { ROUTES } from '@/routes';

export function middleware(request: NextRequest) {
  const session = request.cookies.get(AUTH.SESSION_COOKIE_KEY);
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith(ROUTES.DASHBOARD) && !session) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // Redirect authenticated users away from public login/signup pages
  if ((pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP) && session) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Next.js requires matcher configurations to be static string literals.
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
