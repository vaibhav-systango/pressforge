import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AppState } from '@/lib/types';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { callBackend } from '@/lib/server/backend-client';

type OrganizationPayload = Pick<AppState, 'organizationName' | 'orgUsers' | 'accountType'>;

export async function PATCH(request: Request) {
  const merge = await parseJsonBody<Partial<OrganizationPayload>>(request);
  if (!merge) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  if (accessToken && merge.organizationName) {
    try {
      await callBackend('/auth/organization', {
        method: 'PUT',
        accessToken,
        body: JSON.stringify({ name: merge.organizationName }),
      });
    } catch (e) {
      console.error('Failed to sync organization name update with backend:', e);
    }
  }

  const result = await withAuth(async (auth) => {
    const state = updateSession(auth.sessionId, (prev) => ({
      ...prev,
      ...(merge.organizationName !== undefined ? { organizationName: merge.organizationName } : {}),
      ...(merge.orgUsers !== undefined ? { orgUsers: merge.orgUsers } : {}),
      ...(merge.accountType !== undefined ? { accountType: merge.accountType } : {}),
    }));
    return { state };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
