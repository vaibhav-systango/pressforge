import { SignJWT, jwtVerify } from 'jose';

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/lib/server/auth/constants';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'pressforge-dev-secret-change-in-production',
);

export interface AccessTokenPayload {
  sessionId: string;
  userId: string;
  userType: string;
  email: string;
}

export interface RefreshTokenPayload {
  sessionId: string;
  tokenId: string;
}

export function createTokenId(): string {
  return crypto.randomUUID();
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export interface BackendAccessTokenPayload {
  sub: string;
  email?: string;
  role?: string;
}

const backendSecret = new TextEncoder().encode(
  process.env.BACKEND_JWT_SECRET ?? process.env.JWT_SECRET ?? '',
);

export async function verifyBackendAccessToken(
  token: string,
): Promise<BackendAccessTokenPayload> {
  const { payload } = await jwtVerify(token, backendSecret);
  const sub = payload.sub as string | undefined;
  if (!sub) {
    throw new Error('Missing sub claim');
  }
  return {
    sub,
    email: payload.email as string | undefined,
    role: payload.role as string | undefined,
  };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as RefreshTokenPayload;
}
