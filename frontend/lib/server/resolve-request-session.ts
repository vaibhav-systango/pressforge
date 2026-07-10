import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { GUEST_SESSION_COOKIE, REFRESH_TOKEN_TTL_SECONDS } from '@/lib/server/auth/constants';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { verifyAccessToken } from '@/lib/server/auth/tokens';

export interface RequestSession {
  sessionId: string;
  accessToken?: string;
  isAuthenticated: boolean;
  guestId?: string;
  isNewGuest: boolean;
}

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

async function resolveAuthenticatedSession(accessToken: string): Promise<RequestSession | null> {
  try {
    const payload = await verifyAccessToken(accessToken);
    return {
      sessionId: payload.sessionId,
      accessToken,
      isAuthenticated: true,
      isNewGuest: false,
    };
  } catch {
    const userId = decodeJwtSub(accessToken);
    if (!userId) return null;
    return {
      sessionId: userId,
      accessToken,
      isAuthenticated: true,
      isNewGuest: false,
    };
  }
}

/** Resolve the current request to an authenticated user session or anonymous guest session. */
export async function resolveRequestSession(): Promise<RequestSession> {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const authenticated = await resolveAuthenticatedSession(accessToken);
    if (authenticated) return authenticated;
  }

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
  const isNewGuest = !guestId;
  if (!guestId) {
    guestId = crypto.randomUUID();
  }

  return {
    sessionId: `guest-${guestId}`,
    isAuthenticated: false,
    guestId,
    isNewGuest,
  };
}

export function applyGuestSessionCookie(
  response: NextResponse,
  guestId: string,
  isNewGuest: boolean,
): NextResponse {
  if (!isNewGuest) return response;

  const secure = process.env.NODE_ENV === 'production' ? true : false;
  response.cookies.set(GUEST_SESSION_COOKIE, guestId, {
    path: '/',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    httpOnly: true,
    secure,
  });

  return response;
}

export function clearGuestSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(GUEST_SESSION_COOKIE, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
  });
  return response;
}

export function getGuestSessionIdFromCookie(guestId: string): string {
  return `guest-${guestId}`;
}
