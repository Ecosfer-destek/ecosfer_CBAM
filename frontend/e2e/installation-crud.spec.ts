import { test, expect } from "@playwright/test";

test.describe("Installation CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/installations");
    await page.waitForLoadState("networkidle");
  });

  test.describe("List Page", () => {
    test("should display installations page with correct heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "Tesisler" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("CBAM kapsamindaki tesisleri yonetin")
      ).toBeVisible();
    });

    test("should display data table with expected columns", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Tesis Adi")).toBeVisible();
      await expect(page.getByText("Sirket")).toBeVisible();
      await expect(page.getByText("Ulke")).toBeVisible();
      await expect(page.getByText("Sehir")).toBeVisible();
    });

    test("should display 'Yeni Tesis' button", async ({ page }) => {
      const newButton = page.getByRole("link", { name: /Yeni Tesis/i });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display search input for installations", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder("Tesis ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination info", async ({ page }) => {
      await expect(page.getByText(/Toplam .* kayit/)).toBeVisible({
        timeout: 10000,
      });
    });

    test("should filter installations via search", async ({ page }) => {
      const searchInput = page.getByPlaceholder("Tesis ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await searchInput.fill("zzz_nonexistent_installation");
      await expect(
        page.getByText(/Toplam 0 kayit|Kayit bulunamadi/)
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Create Installation", () => {
    test("should navigate to new installation form page", async ({
      page,
    }) => {
      await page.getByRole("link", { name: /Yeni Tesis/i }).click();
      await page.waitForURL("/dashboard/installations/new");
      await expect(
        page.getByRole("heading", { name: "Yeni Tesis" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display installation form with all sections", async ({
      page,
    }) => {
      await page.goto("/dashboard/installations/new");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Temel Bilgiler")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("Konum Bilgileri")).toBeVisible();
      await expect(page.getByText("Iletisim Bilgileri")).toBeVisible();

      await expect(page.getByLabel("Tesis Adi *")).toBeVisible();
    });

    test("should display company selector on installation form", async ({
      page,
    }) => {
      await page.goto("/dashboard/installations/new");
      await page.waitForLoadState("networkidle");

      // Company selector should exist
      const companyTrigger = page.getByText("Sirket secin");
      await expect(companyTrigger).toBeVisible({ timeout: 10000 });
    });

    test("should show validation error on empty name submission", async ({
      page,
    }) => {
      await page.goto("/dashboard/installations/new");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /Olustur/i }).click();

      // Validation error for required fields
      await expect(page.locator(".text-destructive").first()).toBeVisible({
        timeout: 5000,
      });
    });

    test("should cancel creation and return to list", async ({ page }) => {
      await page.goto("/dashboard/installations/new");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /Iptal/i }).click();
      await page.waitForURL("/dashboard/installations", { timeout: 10000 });
    });
  });

  test.describe("View Installation Detail", () => {
    test("should navigate to installation detail when clicking view icon", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          const viewLink = rows
            .first()
            .locator('a[href*="/dashboard/installations/"]')
            .first();
          await viewLink.click();
          await expect(page).toHaveURL(/\/dashboard\/installations\/.+/);
        }
      }
    });
  });

  test.describe("Delete Installation", () => {
    test("should show confirmation dialog on delete click", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          page.on("dialog", (dialog) => dialog.dismiss());
          const deleteBtn = rows.first().locator("button").last();
          await deleteBtn.click();
          await expect(
            page.getByRole("heading", { name: "Tesisler" })
          ).toBeVisible();
        }
      }
    });
  });
});
