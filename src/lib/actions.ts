"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { api, ApiError, apiBaseUrl, toApiError } from "./api";
import { ACCESS_COOKIE, COOKIE_OPTIONS, cookiesForTokens, REFRESH_COOKIE } from "./tokens";
import type { Customer, TokenResponse } from "./types";

export interface FormState {
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

function safeNext(next: FormDataEntryValue | null): string {
  // Only same-site relative paths, so ?next= cannot redirect users to another site.
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

async function storeTokens(tokens: TokenResponse) {
  const jar = await cookies();
  for (const cookie of cookiesForTokens(tokens)) jar.set(cookie.name, cookie.value, { ...COOKIE_OPTIONS, maxAge: cookie.maxAge });
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { message: "The API is not reachable. Check that it is running and API_URL is correct.", values: { email } };
  }
  if (!response.ok) {
    const error = await toApiError(response);
    return { message: error.status === 422 ? "Enter a valid e-mail address." : error.message, values: { email } };
  }

  await storeTokens((await response.json()) as TokenResponse);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    // Revoke the session server-side too; ignore failures, the cookies are cleared either way.
    await fetch(`${apiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect("/login");
}

function customerPayload(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: company || null,
    status: String(formData.get("status") ?? "lead"),
    lifetime_value: String(formData.get("lifetime_value") ?? "0") || "0",
  };
}

function formFailure(error: unknown, values: Record<string, unknown>): FormState {
  const asStrings = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v == null ? "" : String(v)]));
  if (error instanceof ApiError) {
    const fieldErrors = error.fieldErrors();
    if (error.status === 409) fieldErrors.email = error.message;
    return { message: error.status === 422 ? "Please correct the highlighted fields." : error.message, fieldErrors, values: asStrings };
  }
  throw error;
}

export async function saveCustomer(customerId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const payload = customerPayload(formData);
  try {
    if (customerId) {
      await api<Customer>(`/customers/${customerId}`, { method: "PATCH", body: payload });
    } else {
      await api<Customer>("/customers", { method: "POST", body: payload });
    }
  } catch (error) {
    return formFailure(error, payload);
  }
  revalidatePath("/customers");
  revalidatePath("/");
  redirect("/customers");
}

export async function deleteCustomer(customerId: string): Promise<FormState> {
  try {
    await api<void>(`/customers/${customerId}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { message: error.message };
    throw error;
  }
  revalidatePath("/customers");
  revalidatePath("/");
  redirect("/customers");
}
