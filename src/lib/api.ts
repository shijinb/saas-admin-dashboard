import "server-only";

import { cookies } from "next/headers";

import { ACCESS_COOKIE } from "./tokens";
import type { Problem } from "./types";

/** Base URL of fastapi-production-starter, e.g. http://localhost:8000. Server-side only. */
export function apiBaseUrl(): string {
  return (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: Problem,
  ) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
  }

  /** Field-level validation messages keyed by field name (last element of the error location). */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const error of this.problem.errors ?? []) {
      const field = String(error.location[error.location.length - 1]);
      result[field] ??= error.message;
    }
    return result;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let problem: Problem;
  try {
    problem = (await response.json()) as Problem;
  } catch {
    problem = { title: response.statusText || "Error", status: response.status, detail: null };
  }
  return new ApiError(response.status, problem);
}

type Query = Record<string, string | number | string[] | undefined>;

export function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${apiBaseUrl()}/api/v1${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === "") continue;
    for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
  }
  return url.toString();
}

/**
 * Calls the API as the signed-in user (access token from the httpOnly cookie).
 * Throws ApiError for non-2xx responses; returns undefined for 204.
 */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const response = await fetch(buildUrl(path, init.query), {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
