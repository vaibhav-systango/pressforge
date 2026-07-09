import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/lib/server/auth/constants';
import { verifyAccessToken, type AccessTokenPayload } from '@/lib/server/auth/tokens';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function jsonError(message: string, status: number, code: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Decode a JWT payload without verifying the signature.
 * Used as a fallback when the token was signed by the real backend (different secret).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payloadB64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Run `handler` with a verified (or decoded) access-token payload.
 *
 * Strategy:
 * 1. Try verifying with the Next.js JWT secret (mock-issued tokens).
 * 2. If that fails, decode the payload without signature check (real backend tokens).
 *    In this case `sessionId` is set to the user's `sub` (backend user id) so that
 *    mock-store routes can still function as a session key.
 *
 * Returns a NextResponse on auth failure, otherwise returns the handler result.
 */
export async function withAuth<T>(
  handler: (auth: AccessTokenPayload) => Promise<T>,
): Promise<T | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  try {
    // Path 1: Next.js-signed token (mock flow)
    const payload = await verifyAccessToken(token);
    return await handler(payload);
  } catch {
    // Path 2: Backend-signed token — decode without signature verification
    const raw = decodeJwtPayload(token);
    if (!raw) {
      return jsonError('Token invalid or expired', 401, 'TOKEN_INVALID');
    }

    // Backend payload: { sub: userId, email, role, exp, iat }
    const userId = (raw.sub as string) ?? '';
    const email = (raw.email as string) ?? '';
    const userType = (raw.role as string) ?? 'individual';

    if (!userId) {
      return jsonError('Token invalid or expired', 401, 'TOKEN_INVALID');
    }

    const auth: AccessTokenPayload = {
      // Use userId as sessionId so mock-store routes that key by sessionId
      // still have a stable identifier per user
      sessionId: userId,
      userId,
      userType,
      email,
    };

    try {
      return await handler(auth);
    } catch (err) {
      if (err instanceof ApiError) {
        return jsonError(err.message, err.status, err.code);
      }
      return jsonError('Internal error', 500, 'INTERNAL_ERROR');
    }
  }
}
