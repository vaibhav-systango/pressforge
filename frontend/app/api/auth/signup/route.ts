import { issueAuthResponse } from '@/lib/server/auth/issue-session';
import type { SignupRequest } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = (await request.json()) as SignupRequest;
  const sessionId = crypto.randomUUID();

  return issueAuthResponse(
    sessionId,
    {
      userId: 'user-new',
      userType: 'agency',
      email: body.email,
      name: body.name ?? 'New User',
    },
    {},
  );
}
