// Cookie names used across server-side auth helpers
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const SESSION_COOKIE = 'pf_session';
export const GUEST_SESSION_COOKIE = 'pf_guest_session';

// Token lifetimes
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 1 day
