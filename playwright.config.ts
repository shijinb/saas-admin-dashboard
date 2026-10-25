import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run the real dashboard against a real fastapi-production-starter API seeded with
// `python -m scripts.seed` (demo users owner@/admin@/member@demo.example.com).
//   E2E_BASE_URL  dashboard URL (default: starts `next start` on :3100; run `npm run build` first)
//   API_URL       API used by the dashboard server (default http://127.0.0.1:8000)
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false, // tests share one seeded database
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npx next start -p 3100", url: `${baseURL}/login`, reuseExistingServer: true, timeout: 60_000 },
});
