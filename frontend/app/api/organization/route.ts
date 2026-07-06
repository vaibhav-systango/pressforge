import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AppState } from '@/lib/types';

type OrganizationPayload = Pick<AppState, 'organizationName' | 'orgUsers' | 'accountType'>;

export async function PATCH(request: Request) {
  const merge = await parseJsonBody<Partial<OrganizationPayload>>(request);
  if (!merge) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
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
