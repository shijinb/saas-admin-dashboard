import { expect, test } from "@playwright/test";

import { DEMO_PASSWORD, signIn } from "./helpers";

test("signed-out visitors are sent to login and returned to the page they wanted", async ({ page }) => {
  await page.goto("/customers?status=active");
  await expect(page).toHaveURL(/\/login\?next=%2Fcustomers%3Fstatus%3Dactive/);

  await page.getByLabel("E-mail").fill("owner@demo.example.com");
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/customers\?status=active$/);
  await expect(page.getByRole("checkbox", { name: "active" })).toBeChecked();
});

test("wrong password shows the API's message and keeps the e-mail", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("owner@demo.example.com");
  await page.getByLabel("Password").fill("wrong password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect e-mail or password" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveValue("owner@demo.example.com");
});

test("open redirects are refused", async ({ page }) => {
  await signIn(page, "owner@demo.example.com", "//evil.example.com");
  await expect(page).toHaveURL(/127\.0\.0\.1|localhost/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("tokens are httpOnly cookies, never visible to page scripts", async ({ page, context }) => {
  await signIn(page);
  const cookies = await context.cookies();
  const session = cookies.filter((c) => c.name.startsWith("sad_"));
  expect(session.map((c) => c.name).sort()).toEqual(["sad_access", "sad_refresh"]);
  expect(session.every((c) => c.httpOnly)).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("sad_");
});

test("sign out ends the session", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
