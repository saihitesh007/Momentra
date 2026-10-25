import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "node scripts/prepare-sqlite-db.mjs && npx prisma migrate deploy && npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { DATABASE_URL: "file:./test.db", GEMINI_API_KEY: "test-key" },
  },
});
