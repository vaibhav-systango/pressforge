/**
 * Client-side helper to check whether the `pf_session` cookie is present.
 * Cookies set as HttpOnly are NOT visible here — this only checks for
 * non-HttpOnly session markers the middleware may set.
 */

const SESSION_COOKIE = 'pf_session';

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}
