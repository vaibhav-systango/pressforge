import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/lib/server/auth/cookies';
import { REFRESH_TOKEN_COOKIE } from '@/lib/server/auth/constants';
import {
  createTokenId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/server/auth/tokens';
import { jsonError } from '@/lib/server/auth/with-auth';
import { getMe, setRefreshTokenId, validateRefreshToken } from '@/lib/server/mock-store';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return jsonError('Refresh token missing', 401, 'REFRESH_MISSING');
  }

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
        userId: user.id,
        userType: user.userType,
        email: user.email,
      }),
      signRefreshToken({ sessionId: payload.sessionId, tokenId: newTokenId }),
    ]);

    const response = NextResponse.json({ success: true, expiresIn: 900 });
    return setAuthCookies(response, accessToken, newRefreshToken);
  } catch {
    return jsonError('Refresh token expired', 401, 'REFRESH_EXPIRED');
  }
}
