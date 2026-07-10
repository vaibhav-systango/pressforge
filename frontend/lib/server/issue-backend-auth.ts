import { NextResponse } from 'next/server';

import { callBackend } from '@/lib/server/backend-client';
import { mapBackendUser, mapBackendUserType } from '@/lib/server/map-backend-user';
import { ensureSession, updateSession } from '@/lib/server/mock-store';
import {
  finalizeGuestMigrationResponse,
  migrateGuestWorkspacesToBackend,
} from '@/lib/server/migrate-guest-workspaces';
import { setAuthCookies } from '@/lib/server/auth/cookies';
import { REFRESH_TOKEN_TTL_SECONDS } from '@/lib/server/auth/constants';
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
  });

  await migrateGuestWorkspacesToBackend(tokenData.accessToken, mapped.userId);

  const response = NextResponse.json({
    user: {
      ...mapped,
      id: mapped.userId,
      onboardingStatus: tokenData.user.onboardingStatus,
      accountType: tokenData.user.accountType,
      organizationId,
    },
    expiresIn: 3600,
  });

  const withAuthCookies = setAuthCookies(response, tokenData.accessToken, tokenData.refreshToken);

  if (organizationId) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    withAuthCookies.headers.append(
      'Set-Cookie',
      `${ORGANIZATION_ID_COOKIE}=${organizationId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${REFRESH_TOKEN_TTL_SECONDS}${secure}`,
    );
  }

  return finalizeGuestMigrationResponse(withAuthCookies);
}
