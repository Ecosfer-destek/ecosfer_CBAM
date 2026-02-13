import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("admin@ecosfer.com");
  await page.getByLabel("Sifre").fill("Admin123!");
  await page.getByRole("button", { name: /giris/i }).click();
  await page.waitForURL("/dashboard");
  await expect(page.getByText("Dashboard")).toBeVisible();
  await page.context().storageState({ path: authFile });
});
