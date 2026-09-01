import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GUEST_ONLY_AUTH_PATHS = ['/', '/auth/login', '/auth/signup', '/auth/accept-invite', '/auth/forgot-password'];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-code',
  '/api/auth/reset-password',
  '/api/session/init',
  '/api/invitations/accept',
  '/api/public',
];

const ACCESS_TOKEN_COOKIE = 'access_token';

function hasValidSession(request: NextRequest): boolean {
  return !!request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
}

async function attemptTokenRefresh(request: NextRequest): Promise<{ success: boolean; cookies?: string[] }> {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return { success: false };
  }

  try {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    const res = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('Cookie') ?? '',
      },
    });

    if (res.ok) {
      const setCookieHeaders = res.headers.getSetCookie();
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        return { success: true, cookies: setCookieHeaders };
      }
    }
  } catch (error) {
    console.error('Middleware token refresh failed:', error);
  }

  return { success: false };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let hasSession = hasValidSession(request);
  let newCookies: string[] | undefined;

  const isRefreshPath = pathname === '/api/auth/refresh' || pathname === '/api/auth/refresh/';

  // If session is expired/missing but refresh token exists, attempt refresh
  if (!isRefreshPath && !hasSession && request.cookies.has('refresh_token')) {
    const refreshResult = await attemptTokenRefresh(request);
    if (refreshResult.success && refreshResult.cookies) {
      hasSession = true;
      newCookies = refreshResult.cookies;
    }
  }

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
    
    let response = NextResponse.next();
    if (newCookies) {
      // Modify request headers so that the downstream Next.js API route gets the new access token
      const requestHeaders = new Headers(request.headers);
      const accessTokenCookie = newCookies.find(c => c.startsWith('access_token='));
      if (accessTokenCookie) {
        const tokenValue = accessTokenCookie.split(';')[0].split('=')[1];
        let cookieHeader = request.headers.get('Cookie') ?? '';
        cookieHeader = cookieHeader.replace(/access_token=[^;]+/, `access_token=${tokenValue}`);
        if (!cookieHeader.includes(`access_token=${tokenValue}`)) {
          cookieHeader += `; access_token=${tokenValue}`;
        }
        requestHeaders.set('Cookie', cookieHeader);
      }
      
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      });
      
      for (const cookie of newCookies) {
        response.headers.append('Set-Cookie', cookie);
      }
    }
    return response;
  }

  if (GUEST_ONLY_AUTH_PATHS.includes(pathname) && hasSession) {
    // Invited users must set a password even if this browser has another session.
    const isAcceptInviteWithToken =
      pathname === '/auth/accept-invite' && request.nextUrl.searchParams.has('token');

    if (!isAcceptInviteWithToken) {
      const response = NextResponse.redirect(new URL('/app', request.url));
      if (newCookies) {
        for (const cookie of newCookies) {
          response.headers.append('Set-Cookie', cookie);
        }
      }
      return response;
    }
  }

  if (pathname.startsWith('/app') || pathname.startsWith('/onboarding')) {
    if (!hasSession) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  if (newCookies) {
    for (const cookie of newCookies) {
      response.headers.append('Set-Cookie', cookie);
    }
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
    '/onboarding/:path*',
    '/api/:path*',
    '/auth/login',
    '/auth/signup',
    '/auth/accept-invite',
    '/auth/forgot-password',
  ],
};

