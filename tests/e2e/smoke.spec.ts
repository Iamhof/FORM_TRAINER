import { expect, test } from "@playwright/test";

const shouldSkip = !process.env.PLAYWRIGHT_BASE_URL;

test.describe("smoke", () => {
  test.skip(shouldSkip, "PLAYWRIGHT_BASE_URL is not configured");

  test("landing page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/form/i);
  });
});

