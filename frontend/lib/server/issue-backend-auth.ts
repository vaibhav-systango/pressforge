import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setAuthCookies } from './auth/cookies';
import { createTokenId, signAccessToken, signRefreshToken } from './auth/tokens';
import { ensureSession, updateSession } from './mock-store';
import { mapBackendUserType } from './map-backend-user';
import { mapBackendUserToMe } from '../auth/me-user';
import type { BackendTokenResponse } from '../types/api';

export const ORGANIZATION_ID_COOKIE = 'org_id';

export async function issueBackendAuthResponse(
  backendData: BackendTokenResponse
): Promise<NextResponse> {
  const sessionId = crypto.randomUUID();
  const tokenId = createTokenId();

  const user = mapBackendUserToMe(backendData.user);
  if (!user) {
    throw new Error('User data is missing in backend token response');
  }

  ensureSession(sessionId, {
    userId: user.id,
    userType: mapBackendUserType(user.accountType),
    email: user.email,
    name: user.fullName,
  });

  if (backendData.organizationId) {
    updateSession(sessionId, {
      accountType: 'organization',
      organizationName: `Org ${backendData.organizationId}`,
    });
  } else if (user.accountType === 'INDIVIDUAL') {
    updateSession(sessionId, {
      accountType: 'individual',
    });
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      sessionId,
      userId: user.id,
      userType: mapBackendUserType(user.accountType),
      email: user.email,
    }),
    signRefreshToken({
      sessionId,
      tokenId,
    }),
  ]);

  const response = NextResponse.json({ user });
  setAuthCookies(response, accessToken, refreshToken);

  if (backendData.organizationId) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.headers.append(
      'Set-Cookie',
      `${ORGANIZATION_ID_COOKIE}=${backendData.organizationId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`
    );
  }

  return response;
}
