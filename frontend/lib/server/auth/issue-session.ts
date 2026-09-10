import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/lib/server/auth/cookies';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/lib/server/auth/constants';
import { createTokenId, signAccessToken, signRefreshToken } from '@/lib/server/auth/tokens';
import { createSession, setRefreshTokenId } from '@/lib/server/mock-store';

interface UserLike {
  userId: string;
  userType: string;
  email: string;
  name?: string;
}

/**
 * Mint access + refresh tokens, persist the session, set cookies, and return
 * a JSON response containing `{ user, expiresIn }`.
 */
export async function issueAuthResponse(
  sessionId: string,
  user: UserLike,
  extra: Record<string, unknown> = {},
): Promise<NextResponse> {
  const tokenId = createTokenId();

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      sessionId,
      userId: user.userId,
      userType: user.userType,
      email: user.email,
    }),
    signRefreshToken({ sessionId, tokenId }),
  ]);

  createSession(sessionId, user);
  setRefreshTokenId(sessionId, tokenId);

  const response = NextResponse.json({
    user: { ...user, id: user.userId },
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    ...extra,
  });

  return setAuthCookies(response, accessToken, refreshToken);
}

