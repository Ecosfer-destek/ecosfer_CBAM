import { test, expect } from "@playwright/test";

test.describe("CBAM Reference Data Page", () => {
  test("should load the page and show 6 sector tabs", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Page title should be visible
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible();

    // 6 sector tabs should exist
    const tabList = page.getByRole("tablist");
    await expect(tabList).toBeVisible();

    const tabs = tabList.getByRole("tab");
    await expect(tabs).toHaveCount(6);
  });

  test("should display sector info card for default tab (Cement)", async ({
    page,
  }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Sector info card should show typical EF
    await expect(page.getByText("0.87 tCO2/t klinker")).toBeVisible();

    // Production route badges - use exact match
    await expect(page.getByText("DRY", { exact: true }).first()).toBeVisible();

    // EU regulation reference
    await expect(
      page.getByText("EU 2023/1773 Annex III, Section 3")
    ).toBeVisible();
  });

  test("should show emissions table with data", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Cement emissions should show source stream names
    await expect(
      page.getByText("Doğalgaz (Klinker Fırını)")
    ).toBeVisible();
    await expect(
      page.getByText("Klinker Kalsinasyonu (Proses)")
    ).toBeVisible();
  });

  test("should switch between sector tabs", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Click Iron & Steel tab
    const tabList = page.getByRole("tablist");
    const steelTab = tabList.getByRole("tab").nth(1);
    await steelTab.click();

    // Should show steel-specific data
    await expect(page.getByText("0.14 tCO2/t (EAF)")).toBeVisible();
    await expect(
      page.getByText("EAF", { exact: true }).first()
    ).toBeVisible();

    // Click Aluminium tab
    const alumTab = tabList.getByRole("tab").nth(2);
    await alumTab.click();

    await expect(page.getByText("1.42 tCO2/t")).toBeVisible();
    await expect(
      page.getByText("HALL-HEROULT", { exact: true })
    ).toBeVisible();
  });

  test("should show fuel balance and GHG balance cards", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Fuel balance table
    await expect(page.getByText("Doğalgaz").first()).toBeVisible();

    // GHG balance
    await expect(page.getByText("CO2 Dengesi")).toBeVisible();
  });

  test("should show production process table", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Production process name for cement
    await expect(
      page.getByText("Klinker Üretimi (Kuru Proses)")
    ).toBeVisible();

    // Emission intensity value
    await expect(page.getByText("0.734")).toBeVisible();
  });

  test("should show education warning note", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Scroll to bottom to see the education note
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Education note - match Turkish text with proper chars
    await expect(
      page.getByText(/eğitim ve referans/i).first()
    ).toBeVisible();
  });

  test("should show load button for unloaded sector", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Scroll to bottom to see action buttons
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // "Verilerime Yukle" button should be visible
    const loadBtn = page.getByRole("button", { name: /verilerime|load/i });
    await expect(loadBtn).toBeVisible();
  });

  test("should open confirmation dialog when clicking load button", async ({
    page,
  }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click load button
    const loadBtn = page.getByRole("button", { name: /verilerime|load/i });
    await loadBtn.click();

    // Dialog should appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Dialog should mention the company name (use first match)
    await expect(
      page.getByRole("dialog").getByText(/Anatolya Çimento/)
    ).toBeVisible();
  });

  test("should show CBAM Reference Data in sidebar", async ({ page }) => {
    await page.goto("/dashboard/cbam-reference-data");
    await page.waitForLoadState("networkidle");

    // Sidebar menu item should be active (look for link)
    await expect(
      page.getByRole("link", { name: /CBAM Referans|CBAM Reference/i })
    ).toBeVisible();
  });
});
