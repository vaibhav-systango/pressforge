import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { addCampaign, getSessionState, updateCampaign } from '@/lib/server/mock-store';
import { isCampaign, parseJsonBody } from '@/lib/server/validate-payload';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') ?? undefined;

  const result = await withAuth(async (auth) => {
    let campaigns = getSessionState(auth.sessionId).campaigns;
    if (workspaceId) {
      campaigns = campaigns.filter((c) => c.workspaceId === workspaceId);
    }
    return { campaigns };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const campaign = await parseJsonBody(request);
  if (!campaign || !isCampaign(campaign)) {
    return NextResponse.json({ error: 'Invalid campaign payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    const created = addCampaign(auth.sessionId, campaign);
    return { campaign: created };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
