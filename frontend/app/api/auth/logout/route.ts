import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { clearAuthCookieHeaders } from '@/lib/server/auth/cookies';
import { REFRESH_TOKEN_COOKIE } from '@/lib/server/auth/constants';
import { verifyRefreshToken } from '@/lib/server/auth/tokens';
import { withAuth } from '@/lib/server/auth/with-auth';
import { clearRefreshToken, logoutUser } from '@/lib/server/mock-store';

export async function POST() {
  const result = await withAuth(async (auth) => {
    logoutUser(auth.sessionId);
    clearRefreshToken(auth.sessionId);
    return { success: true };
  });

  if (result instanceof NextResponse) {
    return result;
  }

  const response = NextResponse.json(result);
  clearAuthCookieHeaders().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      clearRefreshToken(payload.sessionId);
    } catch {
      // ignore
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookieHeaders().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}
