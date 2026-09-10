import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getSessionState, updateCampaign } from '@/lib/server/mock-store';
import { isCampaign, parseJsonBody } from '@/lib/server/validate-payload';

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
  const campaign = await parseJsonBody(request);

  if (!campaign || !isCampaign(campaign)) {
    return NextResponse.json({ error: 'Invalid campaign payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if (campaign.id !== id) {
    return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    const updated = updateCampaign(auth.sessionId, campaign);
    return { campaign: updated };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
