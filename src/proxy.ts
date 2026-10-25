import { type NextRequest, NextResponse } from "next/server";

import { refreshTokens } from "@/lib/refresh";
import { ACCESS_COOKIE, COOKIE_OPTIONS, cookiesForTokens, needsRefresh, REFRESH_COOKIE } from "@/lib/tokens";

/**
 * Keeps the session alive: when the access token is missing or about to expire, exchange the refresh
 * token for a new pair before the page renders. Authorization itself is enforced by the API on every
 * call; this only decides whether to send someone to /login.
 */
export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!needsRefresh(access)) return NextResponse.next();
  if (!refresh) return toLogin(request);

  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const tokens = await refreshTokens(apiUrl, refresh);
  if (!tokens) return toLogin(request);

  const fresh = cookiesForTokens(tokens);

  // Make the new tokens visible to this request's Server Components…
  for (const cookie of fresh) request.cookies.set(cookie.name, cookie.value);
  const response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
  // …and store them in the browser for the next requests.
  for (const cookie of fresh) response.cookies.set(cookie.name, cookie.value, { ...COOKIE_OPTIONS, maxAge: cookie.maxAge });
  return response;
}

function toLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export const config = {
  // Everything except the login page, Next.js internals and static files.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
