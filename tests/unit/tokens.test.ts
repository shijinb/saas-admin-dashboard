import { describe, expect, it } from "vitest";

import { ACCESS_COOKIE, cookiesForTokens, needsRefresh, REFRESH_COOKIE, tokenExpiry } from "@/lib/tokens";

function jwt(payload: object): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("tokenExpiry", () => {
  it("reads exp from a JWT payload (base64url)", () => {
    expect(tokenExpiry(jwt({ exp: 1_900_000_000, sub: "ü/?" }))).toBe(1_900_000_000);
  });

  it("returns null for missing or malformed tokens", () => {
    expect(tokenExpiry(undefined)).toBeNull();
    expect(tokenExpiry("not-a-jwt")).toBeNull();
    expect(tokenExpiry("a.###.c")).toBeNull();
    expect(tokenExpiry(jwt({ sub: "no exp" }))).toBeNull();
  });
});

describe("needsRefresh", () => {
  const now = 1_000_000;
  it("refreshes when missing, expired or within the 30 s leeway", () => {
    expect(needsRefresh(undefined, now)).toBe(true);
    expect(needsRefresh(jwt({ exp: now - 1 }), now)).toBe(true);
    expect(needsRefresh(jwt({ exp: now + 30 }), now)).toBe(true);
  });

  it("keeps a token with more than 30 s left", () => {
    expect(needsRefresh(jwt({ exp: now + 31 }), now)).toBe(false);
  });
});

describe("cookiesForTokens", () => {
  it("uses expires_in for the access cookie and the refresh token's exp for the refresh cookie", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const cookies = cookiesForTokens({ access_token: "a", refresh_token: jwt({ exp }), expires_in: 900 });
    expect(cookies[0]).toEqual({ name: ACCESS_COOKIE, value: "a", maxAge: 900 });
    expect(cookies[1].name).toBe(REFRESH_COOKIE);
    expect(cookies[1].maxAge).toBeGreaterThan(3590);
    expect(cookies[1].maxAge).toBeLessThanOrEqual(3600);
  });
});
