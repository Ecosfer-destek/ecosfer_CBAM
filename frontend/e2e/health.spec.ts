import { test, expect } from "@playwright/test";

test.describe("Health & API", () => {
  test("Next.js app is running", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.ok()).toBe(true);
  });

  test("API auth route exists", async ({ request }) => {
    const response = await request.get("/api/auth/providers");
    expect(response.status()).toBeLessThan(500);
  });
});
