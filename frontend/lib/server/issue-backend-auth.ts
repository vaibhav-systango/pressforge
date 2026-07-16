import { NextResponse } from 'next/server';

import { mapBackendUser, mapBackendUserType } from '@/lib/server/map-backend-user';
import { ensureSession, updateSession } from '@/lib/server/mock-store';
import {
  finalizeGuestMigrationResponse,
  migrateGuestWorkspacesToBackend,
} from '@/lib/server/migrate-guest-workspaces';
import { setAuthCookies } from '@/lib/server/auth/cookies';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '@/lib/server/auth/constants';
import type { BackendTokenResponse } from '@/lib/types/api';

export const ORGANIZATION_ID_COOKIE = 'organization_id';

/** Set auth cookies from a backend Token response and return a client-safe JSON body. */
export async function issueBackendAuthResponse(
  tokenData: BackendTokenResponse,
): Promise<NextResponse> {
  const mapped = mapBackendUser(tokenData.user);
  const organizationId = tokenData.user.organizationId ?? tokenData.organizationId ?? null;
  const onboardingCompleted = tokenData.user.onboardingStatus === 'COMPLETED';
  const accountType =
    tokenData.user.accountType === 'ORGANIZATION'
      ? 'organization'
      : tokenData.user.accountType === 'INDIVIDUAL'
        ? 'individual'
        : tokenData.user.accountType.startsWith('ORG_')
          ? 'organization'
          : 'individual';

  ensureSession(mapped.userId, {
    userId: mapped.userId,
    userType: mapped.userType,
    email: mapped.email,
    name: mapped.name,
  });

  updateSession(mapped.userId, {
    onboardingCompleted,
    currentUserType: mapBackendUserType(tokenData.user.accountType),
    accountType,
    currentUserEmail: mapped.email,
    currentUserName: mapped.name,
    ...(tokenData.user.organizationName
      ? { organizationName: tokenData.user.organizationName }
      : {}),
  });

  try {
    await migrateGuestWorkspacesToBackend(tokenData.accessToken, mapped.userId);
  } catch (error) {
    console.error('Guest workspace migration failed:', error);
  }

  const response = NextResponse.json({
    user: {
      ...mapped,
      id: mapped.userId,
      onboardingStatus: tokenData.user.onboardingStatus,
      accountType: tokenData.user.accountType,
      organizationId,
      organizationName: tokenData.user.organizationName ?? null,
    },
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

  const withAuthCookies = setAuthCookies(response, tokenData.accessToken, tokenData.refreshToken);


  if (organizationId) {
    withAuthCookies.cookies.set(ORGANIZATION_ID_COOKIE, organizationId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return finalizeGuestMigrationResponse(withAuthCookies);
}
