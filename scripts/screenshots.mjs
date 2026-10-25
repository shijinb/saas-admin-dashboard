// Regenerates docs/screenshots/*.png from a running dashboard (default http://127.0.0.1:3100)
// backed by an API seeded with `python -m scripts.seed`. All data shown is synthetic.
import { chromium, devices } from "@playwright/test";

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const out = new URL("../docs/screenshots/", import.meta.url);
const browser = await chromium.launch();

async function session(options) {
  const context = await browser.newContext({ ...options, baseURL: base });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("owner@demo.example.com");
  await page.getByLabel("Password").fill("demo-password-change-me");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  return page;
}

const desktop = await session({ viewport: { width: 1400, height: 860 } });
await desktop.goto("/");
await desktop.getByText("Recently added").waitFor();
await desktop.screenshot({ path: new URL("dashboard.png", out).pathname });
await desktop.goto("/customers?status=active&sort=-lifetime_value");
await desktop.locator("tbody tr").first().waitFor();
await desktop.screenshot({ path: new URL("customers.png", out).pathname });
await desktop.goto("/customers/new");
await desktop.getByLabel("Name").fill("Priya Sharma");
await desktop.getByLabel("E-mail").fill("priya@");
await desktop.getByLabel("Lifetime value (USD)").fill("-10");
await desktop.getByRole("button", { name: "Create customer" }).click();
await desktop.getByText("Please correct the highlighted fields.").waitFor();
await desktop.screenshot({ path: new URL("validation.png", out).pathname });

const mobile = await session({ ...devices["Pixel 7"] });
await mobile.goto("/customers");
await mobile.locator("tbody tr").first().waitFor();
await mobile.getByRole("button", { name: "Menu" }).click();
await mobile.screenshot({ path: new URL("mobile.png", out).pathname });

await browser.close();
console.log("screenshots written to docs/screenshots/");
