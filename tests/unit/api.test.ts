import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token-123" }) }) }));

import { api, ApiError, buildUrl } from "@/lib/api";

describe("buildUrl", () => {
  it("encodes query values, repeats arrays and skips empty values", () => {
    process.env.API_URL = "http://api.example.com/";
    expect(buildUrl("/customers", { q: "a&b", status: ["lead", "active"], page: 2, sort: "", owner: undefined })).toBe(
      "http://api.example.com/api/v1/customers?q=a%26b&status=lead&status=active&page=2",
    );
  });
});

describe("api", () => {
  it("sends the access token and parses JSON", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/auth/me")).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
    expect(init.cache).toBe("no-store");
  });

  it("turns problem-details responses into ApiError with field errors", async () => {
    const problem = {
      title: "Validation failed",
      status: 422,
      detail: "The request contains invalid fields.",
      errors: [
        { location: ["body", "email"], message: "not a valid email", type: "value_error" },
        { location: ["body", "email"], message: "second message ignored", type: "x" },
        { location: ["body", "lifetime_value"], message: "must be >= 0", type: "x" },
      ],
    };
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(problem), { status: 422 }));
    const error = await api("/customers", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).fieldErrors()).toEqual({ email: "not a valid email", lifetime_value: "must be >= 0" });
  });

  it("handles non-JSON error bodies and 204 responses", async () => {
    vi.stubGlobal("fetch", async () => new Response("Bad gateway", { status: 502, statusText: "Bad Gateway" }));
    const error = (await api("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(502);
    expect(error.message).toBe("Bad Gateway");

    vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));
    await expect(api("/x", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
