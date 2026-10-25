import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

test("dashboard shows figures that match the customer list", async ({ page }) => {
  await signIn(page);
  const total = await page.getByText("Customers", { exact: true }).locator("xpath=following-sibling::p[1]").innerText();
  await page.getByRole("link", { name: "View all →" }).click();
  await expect(page.getByText(`${total} in total`)).toBeVisible();
});

test("search, status filter, sort and pagination use the URL", async ({ page }) => {
  await signIn(page);
  await page.goto("/customers");
  await page.getByRole("checkbox", { name: "churned" }).check();
  await page.getByLabel("Sort").selectOption("name");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/status=churned.*sort=name/);

  const statuses = await page.locator("tbody td:nth-child(3)").allInnerTexts();
  expect(statuses.length).toBeGreaterThan(0);
  expect(new Set(statuses)).toEqual(new Set(["churned"]));
  const names = await page.locator("tbody td:first-child a").allInnerTexts();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

  await page.getByLabel("Search").fill("zz-no-such-customer");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("No customers match these filters")).toBeVisible();
});

test("create (with validation), edit and delete a customer", async ({ page }) => {
  const email = `e2e-${Date.now()}@customers.example.com`;
  await signIn(page);
  await page.goto("/customers/new");

  await page.getByLabel("Name").fill("E2E Person");
  await page.getByLabel("E-mail").fill("not-an-email");
  await page.getByLabel("Lifetime value (USD)").fill("-5");
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please correct the highlighted fields." })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Input should be greater than or equal to 0")).toBeVisible();

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Lifetime value (USD)").fill("1234.5");
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page).toHaveURL(/\/customers$/);

  await page.getByLabel("Search").fill(email);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("$1,234.50");

  await page.getByRole("link", { name: "E2E Person" }).click();
  await page.getByLabel("Status").selectOption("active");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/customers$/); // saved and redirected
  await page.goto(`/customers?q=${encodeURIComponent(email)}`);
  await expect(page.locator("tbody")).toContainText("active");

  await page.getByRole("link", { name: "E2E Person" }).click();
  await page.getByRole("button", { name: "Delete customer" }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.goto(`/customers?q=${encodeURIComponent(email)}`);
  await expect(page.getByText("No customers match these filters")).toBeVisible();

  await page.goto("/audit");
  await expect(page.getByText("customer.deleted").first()).toBeVisible();
});

test("duplicate e-mail is reported on the field", async ({ page }) => {
  const email = `dup-${Date.now()}@customers.example.com`;
  await signIn(page);
  for (const attempt of [1, 2]) {
    await page.goto("/customers/new");
    await page.getByLabel("Name").fill(`Dup ${attempt}`);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Create customer" }).click();
  }
  await expect(page.getByText("A customer with this e-mail already exists").first()).toBeVisible();
});

test("unknown customer IDs show the not-found page", async ({ page }) => {
  await signIn(page);
  await page.goto("/customers/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("This record does not exist or belongs to another organization.")).toBeVisible();
  await page.goto("/customers/not-a-uuid");
  await expect(page.getByText("This record does not exist or belongs to another organization.")).toBeVisible();
});

test("members see no audit log or delete button", async ({ page }) => {
  await signIn(page, "member@demo.example.com");
  await expect(page.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  await page.goto("/audit");
  await expect(page.getByRole("alert").filter({ hasText: "only available to admins" })).toBeVisible();

  await page.goto("/customers");
  await page.locator("tbody td:first-child a").first().click();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete customer" })).toHaveCount(0);
});

test("@mobile navigation collapses into a menu on small screens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).toBeHidden();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Customers" }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(nav).toBeHidden();
  // The table scrolls inside its container rather than widening the page.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
