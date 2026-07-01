import { NextResponse } from 'next/server';

import { MOCK_JOURNALISTS } from '@/lib/data/mock-data';
import { withAuth } from '@/lib/server/auth/with-auth';

export async function GET() {
  const result = await withAuth(async () => ({ journalists: MOCK_JOURNALISTS }));

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
