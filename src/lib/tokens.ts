// Token helpers shared by the proxy and server code. Pure functions: no Next.js imports, easy to test.

export const ACCESS_COOKIE = "sad_access";
export const REFRESH_COOKIE = "sad_refresh";

/** Seconds of remaining validity below which the proxy refreshes the access token ahead of time. */
export const REFRESH_LEEWAY_SECONDS = 30;

/**
 * Reads the `exp` claim of a JWT without verifying it. Only used to decide *when* to refresh;
 * the API verifies every token it receives.
 */
export function tokenExpiry(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function needsRefresh(accessToken: string | undefined, nowSeconds = Date.now() / 1000): boolean {
  const exp = tokenExpiry(accessToken);
  return exp === null || exp - REFRESH_LEEWAY_SECONDS <= nowSeconds;
}

export interface CookieSpec {
  name: string;
  value: string;
  maxAge: number;
}

/** Cookie values and lifetimes for a token pair (refresh cookie lives as long as the refresh token). */
export function cookiesForTokens(tokens: { access_token: string; refresh_token: string; expires_in: number }): CookieSpec[] {
  const refreshExp = tokenExpiry(tokens.refresh_token);
  const refreshMaxAge = refreshExp ? Math.max(0, Math.floor(refreshExp - Date.now() / 1000)) : 14 * 24 * 3600;
  return [
    { name: ACCESS_COOKIE, value: tokens.access_token, maxAge: tokens.expires_in },
    { name: REFRESH_COOKIE, value: tokens.refresh_token, maxAge: refreshMaxAge },
  ];
}

export const COOKIE_OPTIONS = {
  httpOnly: true, // never readable by browser JavaScript
  sameSite: "lax" as const,
  // Secure by default in production. Set COOKIE_SECURE=false only for plain-HTTP setups such as local
  // end-to-end tests; some browsers refuse Secure cookies on http://localhost.
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
  path: "/",
};
