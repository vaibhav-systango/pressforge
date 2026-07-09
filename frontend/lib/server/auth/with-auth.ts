import { NextResponse } from 'next/server';
import { getAccessToken } from './get-access-token';
import { verifyAccessToken } from './tokens';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function jsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export interface AuthContext {
  sessionId: string;
  userId: string;
  userType: string;
  email: string;
}

export async function withAuth<T>(
  handler: (auth: AuthContext) => Promise<T>
): Promise<NextResponse | T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return await handler({
      sessionId: payload.sessionId,
      userId: payload.userId,
      userType: payload.userType,
      email: payload.email,
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return jsonError(err.message, err.status, err.code);
    }
    return jsonError('Token invalid or expired', 401, 'TOKEN_INVALID');
  }
}
