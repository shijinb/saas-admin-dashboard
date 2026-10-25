import { beforeEach, describe, expect, it, vi } from "vitest";

import { refreshTokens, resetRefreshCache } from "@/lib/refresh";

const pair = { access_token: "a2", refresh_token: "r2", token_type: "bearer", expires_in: 900 };

describe("refreshTokens", () => {
  beforeEach(() => resetRefreshCache());

  it("makes one API call for concurrent requests with the same refresh token", async () => {
    let resolve!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((r) => (resolve = r)));
    const calls = [1, 2, 3].map(() => refreshTokens("http://api", "r1", fetchMock as unknown as typeof fetch));
    resolve(new Response(JSON.stringify(pair), { status: 200 }));
    expect(await Promise.all(calls)).toEqual([pair, pair, pair]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the result briefly, then calls again", async () => {
    let clock = 0;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(pair), { status: 200 }));
    const call = () => refreshTokens("http://api", "r1", fetchMock as unknown as typeof fetch, () => clock);
    await call();
    clock = 9_000;
    await call();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    clock = 10_001;
    await call();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(pair), { status: 200 }));
    expect(await refreshTokens("http://api", "r1", fetchMock)).toBeNull();
    expect(await refreshTokens("http://api", "r1", fetchMock)).toEqual(pair);
  });

  it("returns null when the API is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    expect(await refreshTokens("http://api", "r1", fetchMock)).toBeNull();
  });
});
