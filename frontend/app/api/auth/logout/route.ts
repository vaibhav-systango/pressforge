import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { clearAuthCookieHeaders } from '@/lib/server/auth/cookies';
import { REFRESH_TOKEN_COOKIE } from '@/lib/server/auth/constants';
import { verifyRefreshToken } from '@/lib/server/auth/tokens';
import { withAuth } from '@/lib/server/auth/with-auth';
import { clearRefreshToken, logoutUser } from '@/lib/server/mock-store';

function buildLogoutResponse() {
  const response = NextResponse.json({ success: true });
  clearAuthCookieHeaders().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}

async function revokeSession(sessionId: string) {
  logoutUser(sessionId);
  clearRefreshToken(sessionId);
}

export async function POST() {
  const result = await withAuth(async (auth) => {
    await revokeSession(auth.sessionId);
    return { success: true };
  });

  if (result instanceof NextResponse) {
    return buildLogoutResponse();
  }

  return buildLogoutResponse();
}

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      await revokeSession(payload.sessionId);
    } catch {
      // ignore invalid refresh tokens
    }
  }

  return buildLogoutResponse();
}
