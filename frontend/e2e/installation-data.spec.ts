import { test, expect } from "@playwright/test";

test.describe("Installation Data Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/installation-data");
    await page.waitForLoadState("networkidle");
  });

  test.describe("List Page", () => {
    test("should display installation data page with heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { level: 1 })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display data table with expected columns", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Tesis")).toBeVisible();
      await expect(page.getByText("Sirket")).toBeVisible();
      await expect(page.getByText("Baslangic")).toBeVisible();
      await expect(page.getByText("Bitis")).toBeVisible();
    });

    test("should display 'Yeni Veri Kaydi' button", async ({ page }) => {
      const newButton = page.getByRole("link", { name: /Yeni Veri Kaydi/i });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder("Tesis ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination info", async ({ page }) => {
      await expect(page.getByText(/Toplam .* kayit/)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Detail Page - 5-Tab Interface", () => {
    test("should display 5-tab interface on detail page if data exists", async ({
      page,
    }) => {
      // Navigate to the first installation data if available
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installation-data/"]')
            .first();
          await viewLink.click();
          await page.waitForURL(/\/dashboard\/installation-data\/.+/, {
            timeout: 10000,
          });

          // Verify 5 tabs exist
          await expect(
            page.getByRole("tab", { name: /A: Tesis Bilgisi/i })
          ).toBeVisible({ timeout: 10000 });
          await expect(
            page.getByRole("tab", { name: /B: Emisyonlar/i })
          ).toBeVisible();
          await expect(
            page.getByRole("tab", { name: /C: Enerji/i })
          ).toBeVisible();
          await expect(
            page.getByRole("tab", { name: /D: Prosesler/i })
          ).toBeVisible();
          await expect(
            page.getByRole("tab", { name: /E: Prekursorler/i })
          ).toBeVisible();
        }
      }
    });

    test("should switch between tabs on detail page", async ({ page }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installation-data/"]')
            .first();
          await viewLink.click();
          await page.waitForURL(/\/dashboard\/installation-data\/.+/, {
            timeout: 10000,
          });

          // Tab A should be active by default - verify its content
          await expect(
            page.getByText("Tesis ve Donem Bilgileri")
          ).toBeVisible({ timeout: 10000 });

          // Switch to Tab B: Emissions
          await page
            .getByRole("tab", { name: /B: Emisyonlar/i })
            .click();
          await expect(page.getByText("Emisyon Kayitlari")).toBeVisible({
            timeout: 5000,
          });

          // Switch to Tab C: Energy & Balance
          await page
            .getByRole("tab", { name: /C: Enerji/i })
            .click();
          await expect(
            page.getByText("Yakit Dengesi (Fuel Balance)")
          ).toBeVisible({ timeout: 5000 });

          // Switch to Tab D: Processes
          await page
            .getByRole("tab", { name: /D: Prosesler/i })
            .click();
          await expect(
            page.getByText("Ilgili Uretim Surecleri")
          ).toBeVisible({ timeout: 5000 });

          // Switch to Tab E: Precursors
          await page
            .getByRole("tab", { name: /E: Prekursorler/i })
            .click();
          await expect(
            page.getByText("Satin Alinan Prekursorler")
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("should display 'Listeye Don' back button on detail page", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installation-data/"]')
            .first();
          await viewLink.click();
          await page.waitForURL(/\/dashboard\/installation-data\/.+/, {
            timeout: 10000,
          });

          const backLink = page.getByRole("link", {
            name: /Listeye Don/i,
          });
          await expect(backLink).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test("should display goods category table in Tab A", async ({ page }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installation-data/"]')
            .first();
          await viewLink.click();
          await page.waitForURL(/\/dashboard\/installation-data\/.+/, {
            timeout: 10000,
          });

          // Tab A should show goods category card
          await expect(
            page.getByText("Mal Kategorileri ve Rotalar")
          ).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test("should display emission table with 'Yeni Emisyon' button in Tab B", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installation-data/"]')
            .first();
          await viewLink.click();
          await page.waitForURL(/\/dashboard\/installation-data\/.+/, {
            timeout: 10000,
          });

          await page
            .getByRole("tab", { name: /B: Emisyonlar/i })
            .click();

          await expect(
            page.getByRole("link", { name: /Yeni Emisyon/i })
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
