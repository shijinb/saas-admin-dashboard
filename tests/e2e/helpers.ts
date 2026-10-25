import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo-password-change-me"; // from the API's seed script; local test data only

export async function signIn(page: Page, email = "owner@demo.example.com", next = "/") {
  await page.goto(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the login action to finish and redirect. (Waiting for the button to change is not enough:
  // its label switches to "Signing in…" immediately, and navigating away would cancel the request.)
  await expect(page).not.toHaveURL(/\/login/);
}
