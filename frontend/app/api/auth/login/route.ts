import { issueAuthResponse } from '@/lib/server/auth/issue-session';
import { jsonError } from '@/lib/server/auth/with-auth';
import { loginUser } from '@/lib/server/mock-store';
import type { LoginRequest } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;
  const sessionId = crypto.randomUUID();

  const user = loginUser(sessionId, body.email, body.password);
  if (!user) {
    return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  return issueAuthResponse(sessionId, user, {});
}
