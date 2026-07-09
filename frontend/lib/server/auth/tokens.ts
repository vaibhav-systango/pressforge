import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-that-is-at-least-32-characters-long'
);

export function createTokenId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function signAccessToken(payload: {
  sessionId: string;
  userId: string;
  userType: string;
  email: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET_KEY);
}

export async function signRefreshToken(payload: {
  sessionId: string;
  tokenId: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET_KEY);
  return payload as {
    sessionId: string;
    userId: string;
    userType: string;
    email: string;
  };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET_KEY);
  return payload as {
    sessionId: string;
    tokenId: string;
  };
}
