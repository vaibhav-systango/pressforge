import { cookies } from 'next/headers';

import { ACCESS_TOKEN_COOKIE } from '@/lib/server/auth/constants';

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}
