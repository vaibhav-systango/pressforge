import type { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE,
} from '@/lib/server/auth/constants';

const COOKIE_BASE = 'HttpOnly; Path=/; SameSite=Lax';

function cookieMaxAge(ttl: number) {
  return `Max-Age=${ttl}`;
}

/** Attach access_token, refresh_token and pf_session cookies to a response. */
export function setAuthCookies<T extends { headers: { append(key: string, value: string): void } }>(
  response: T,
  accessToken: string,
  refreshToken: string,
): T {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  response.headers.append(
    'Set-Cookie',
    `${ACCESS_TOKEN_COOKIE}=${accessToken}; ${COOKIE_BASE}; ${cookieMaxAge(ACCESS_TOKEN_TTL_SECONDS)}${secure}`,
  );
  response.headers.append(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=${refreshToken}; ${COOKIE_BASE}; ${cookieMaxAge(REFRESH_TOKEN_TTL_SECONDS)}${secure}`,
  );
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=1; Path=/; SameSite=Lax; ${cookieMaxAge(REFRESH_TOKEN_TTL_SECONDS)}${secure}`,
  );

  return response;
}

/** Return Set-Cookie strings that clear all auth cookies. */
export function clearAuthCookieHeaders(): string[] {
  return [
    `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${REFRESH_TOKEN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    `organization_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  ];
}
