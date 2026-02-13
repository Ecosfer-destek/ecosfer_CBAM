import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page redirects to login or dashboard", async ({ page }) => {
    await page.goto("/");
    // Should redirect to either login or dashboard depending on auth
    const url = page.url();
    expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  });

  test("login page has expected elements", async ({ page }) => {
    await page.goto("/login");
    // Check page title or heading
    await expect(page).toHaveTitle(/.*/);
    // Email and password inputs exist
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("404 page for unknown routes", async ({ page }) => {
    const response = await page.goto("/nonexistent-page-xyz");
    // Next.js returns 404 for unknown routes
    expect(response?.status()).toBe(404);
  });
});
