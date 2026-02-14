import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("info@ecosfer.com");
  await page.getByLabel("Şifre").fill("Ankara3406.");
  await page.getByRole("button", { name: /giriş/i }).click();
  await page.waitForURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
