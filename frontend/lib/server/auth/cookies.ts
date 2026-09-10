import type { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE,
} from '@/lib/server/auth/constants';

const ORGANIZATION_ID_COOKIE = 'organization_id';

function cookieOptions(maxAge: number) {
  return {
    path: '/' as const,
    sameSite: 'lax' as const,
    maxAge,
    secure: true,
  };
}

/** Attach access_token, refresh_token and pf_session cookies to a response. */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieOptions(ACCESS_TOKEN_TTL_SECONDS),
    httpOnly: true,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieOptions(REFRESH_TOKEN_TTL_SECONDS),
    httpOnly: true,
  });
  response.cookies.set(SESSION_COOKIE, '1', {
    ...cookieOptions(REFRESH_TOKEN_TTL_SECONDS),
    httpOnly: false,
  });

  return response;
}

/** Clear all auth cookies on a response. */
export function clearAuthCookies(response: NextResponse): NextResponse {
  for (const name of [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    SESSION_COOKIE,
    ORGANIZATION_ID_COOKIE,
  ]) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 });
  }

  return response;
}

/** @deprecated Use clearAuthCookies instead. */
export function clearAuthCookieHeaders(): string[] {
  return [
    `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${REFRESH_TOKEN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    `${ORGANIZATION_ID_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  ];
}
