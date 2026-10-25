import type { TokenResponse } from "./types";

/**
 * Exchanges a refresh token for a new token pair, at most once per refresh token.
 *
 * A single page load sends several requests at once (the page plus link prefetches), all carrying the
 * same refresh cookie. Without this, each would call /auth/refresh with the same token, and the API
 * would treat every call after the first as token reuse. Requests that arrive together share one call,
 * and the result is kept for a few seconds for requests that still carry the old cookie.
 *
 * Per server process. With several dashboard instances, the API's reuse grace window covers the rest.
 */
const SHARE_RESULT_MS = 10_000;

interface Entry {
  promise: Promise<TokenResponse | null>;
  expiresAt: number;
}

const inflight = new Map<string, Entry>();

export function refreshTokens(
  apiUrl: string,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<TokenResponse | null> {
  for (const [token, entry] of inflight) if (entry.expiresAt <= now()) inflight.delete(token);

  const existing = inflight.get(refreshToken);
  if (existing) return existing.promise;

  const promise = (async () => {
    try {
      const response = await fetchImpl(`${apiUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (!response.ok) {
        inflight.delete(refreshToken); // never cache a failure
        return null;
      }
      return (await response.json()) as TokenResponse;
    } catch {
      inflight.delete(refreshToken);
      return null;
    }
  })();

  inflight.set(refreshToken, { promise, expiresAt: now() + SHARE_RESULT_MS });
  return promise;
}

/** Test helper. */
export function resetRefreshCache(): void {
  inflight.clear();
}
