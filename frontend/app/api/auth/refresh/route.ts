import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/lib/server/auth/cookies';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_COOKIE } from '@/lib/server/auth/constants';
import {
  createTokenId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/server/auth/tokens';
import { jsonError } from '@/lib/server/auth/with-auth';
import { getMe, setRefreshTokenId, validateRefreshToken } from '@/lib/server/mock-store';
import { callBackend } from '@/lib/server/backend-client';
import { issueBackendAuthResponse } from '@/lib/server/issue-backend-auth';
import type { BackendTokenResponse } from '@/lib/types/api';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return jsonError('Refresh token missing', 401, 'REFRESH_MISSING');
  }

  // 1. Try local frontend-signed token first (mock/client flow)
  try {
    const payload = await verifyRefreshToken(refreshToken);

    if (!validateRefreshToken(payload.sessionId, payload.tokenId)) {
      return jsonError('Refresh token revoked', 401, 'REFRESH_INVALID');
    }

    const { user } = getMe(payload.sessionId);
    const newTokenId = createTokenId();
    setRefreshTokenId(payload.sessionId, newTokenId);

    const [accessToken, newRefreshToken] = await Promise.all([
      signAccessToken({
        sessionId: payload.sessionId,
        userId: user.userId,
        userType: user.userType,
        email: user.email,
      }),
      signRefreshToken({ sessionId: payload.sessionId, tokenId: newTokenId }),
    ]);

    const response = NextResponse.json({ success: true, expiresIn: ACCESS_TOKEN_TTL_SECONDS });

    return setAuthCookies(response, accessToken, newRefreshToken);
  } catch {
    // 2. If frontend-signed token verification failed, try backend refresh flow
    try {
      const { data, errorMessage, response } = await callBackend<BackendTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (!data) {
        return jsonError(
          errorMessage ?? 'Invalid or expired refresh token',
          response.status === 401 ? 401 : response.status,
          'REFRESH_INVALID',
        );
      }

      return await issueBackendAuthResponse(data);
    } catch {
      return jsonError('Refresh token expired or invalid', 401, 'REFRESH_EXPIRED');
    }
  }
}
