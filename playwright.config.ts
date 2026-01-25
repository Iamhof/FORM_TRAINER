import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8081";

export default defineConfig({
  testDir: "./tests/e2e",
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npx expo start --web --non-interactive --port 8081",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: process.env.CI ? "retain-on-failure" : "on",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

