import { NextResponse } from 'next/server';
import { setAuthCookies } from './cookies';
import { createTokenId, signAccessToken, signRefreshToken } from './tokens';

export async function issueAuthResponse(
  sessionId: string,
  user: any,
  meta?: any
): Promise<NextResponse> {
  const tokenId = createTokenId();

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      sessionId,
      userId: user.userId || user.id,
      userType: user.userType || user.accountType,
      email: user.email,
    }),
    signRefreshToken({
      sessionId,
      tokenId,
    }),
  ]);

  const response = NextResponse.json({ success: true, user });
  setAuthCookies(response, accessToken, refreshToken);
  return response;
}
