// Cookie names used across server-side auth helpers
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const SESSION_COOKIE = 'pf_session';

// Token lifetimes
export const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 min
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
