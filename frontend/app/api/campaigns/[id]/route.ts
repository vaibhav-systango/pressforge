import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getSessionState, updateCampaign } from '@/lib/server/mock-store';
import type { Campaign } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const campaign = getSessionState(auth.sessionId).campaigns.find((c) => c.id === id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return { campaign };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const campaign = (await request.json()) as Campaign;
    if (campaign.id !== id) {
      return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
    }
    const updated = updateCampaign(auth.sessionId, campaign);
    return { campaign: updated };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
