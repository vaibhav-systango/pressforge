/**
 * Thin wrappers around localStorage for storing/reading auth tokens on the
 * client side (access_token). These are checked by the auth-route-guard.
 */

const ACCESS_TOKEN_KEY = 'access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/** Returns true if an access token exists in localStorage. */
export function hasAuthTokens(): boolean {
  return Boolean(getAccessToken());
}
