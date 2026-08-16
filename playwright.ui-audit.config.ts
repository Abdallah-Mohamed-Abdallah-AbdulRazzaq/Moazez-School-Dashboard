import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["auth.setup.ts", "ui-audit.spec.ts", "accessibility-audit.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: process.env.UI_AUDIT_BASE_URL || "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
