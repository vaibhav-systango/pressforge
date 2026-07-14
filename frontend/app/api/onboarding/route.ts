import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError, withAuth } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { ORGANIZATION_ID_COOKIE } from '@/lib/server/issue-backend-auth';
import { ensureSession, updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { BackendUserResponse, OnboardingRequest } from '@/lib/types/api';
import { mapBackendUserType } from '@/lib/server/map-backend-user';

function mapOnboardingErrorStatus(status: number): string {
  if (status === 400) return 'ONBOARDING_INVALID';
  if (status === 404) return 'USER_NOT_FOUND';
  return 'ONBOARDING_FAILED';
}

export async function POST(request: Request) {
  const body = await parseJsonBody<OnboardingRequest>(request);
  if (!body?.accountType) {
    return jsonError('Invalid onboarding payload', 400, 'BAD_REQUEST');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<BackendUserResponse>('/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    accessToken,
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Unable to complete onboarding',
      response.status,
      mapOnboardingErrorStatus(response.status),
    );
  }

  const sessionResult = await withAuth(async (auth) => {
    ensureSession(auth.sessionId, {
      userId: auth.userId,
      userType: auth.userType,
      email: auth.email,
      name: auth.email,
    });

    updateSession(auth.sessionId, {
      onboardingCompleted: true,
      currentUserType: mapBackendUserType(data.accountType),
      accountType: body.accountType === 'ORGANIZATION' ? 'organization' : 'individual',
      ...(body.accountType === 'ORGANIZATION' && body.organizationDetails
        ? { organizationName: body.organizationDetails.name }
        : data.organizationName
          ? { organizationName: data.organizationName }
          : {}),
    });

    return { ok: true };
  });

  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const cookieStore = await cookies();
  const nextResponse = NextResponse.json({ user: data });

  if (data.organizationId) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    nextResponse.headers.append(
      'Set-Cookie',
      `${ORGANIZATION_ID_COOKIE}=${data.organizationId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`,
    );
  } else if (cookieStore.get(ORGANIZATION_ID_COOKIE)) {
    nextResponse.headers.append(
      'Set-Cookie',
      `${ORGANIZATION_ID_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    );
  }

  return nextResponse;
}
