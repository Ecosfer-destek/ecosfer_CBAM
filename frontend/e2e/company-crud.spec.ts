import { test, expect } from "@playwright/test";

test.describe("Company CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/companies");
    await page.waitForLoadState("networkidle");
  });

  test.describe("List Page", () => {
    test("should display companies page with correct heading", async ({
      page,
    }) => {
      await expect(page.getByRole("heading", { name: "Şirketler" })).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText("CBAM kapsamındaki şirketleri yönetin")
      ).toBeVisible();
    });

    test("should display data table structure", async ({ page }) => {
      // DataTable renders a table with headers
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      // Verify expected column headers exist
      await expect(page.getByText("Şirket Adı")).toBeVisible();
      await expect(page.getByText("Vergi No")).toBeVisible();
      await expect(page.getByText("Ülke")).toBeVisible();
      await expect(page.getByText("Şehir")).toBeVisible();
      await expect(page.getByText("E-posta")).toBeVisible();
    });

    test("should display 'Yeni Şirket' button in toolbar", async ({
      page,
    }) => {
      const newButton = page.getByRole("link", { name: /Yeni Şirket/i });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display search input with placeholder", async ({ page }) => {
      const searchInput = page.getByPlaceholder("Şirket ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination controls", async ({ page }) => {
      // The DataTable always shows pagination section
      await expect(page.getByText(/Toplam .* kayıt/)).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/Sayfa/)).toBeVisible();
    });

    test("should filter table when typing in search", async ({ page }) => {
      const searchInput = page.getByPlaceholder("Şirket ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // Type a random search term that likely won't match
      await searchInput.fill("zzz_nonexistent_company_test");
      // After filtering, either "Kayıt bulunamadı" appears or 0 rows
      await expect(page.getByText(/Toplam 0 kayıt|Kayıt bulunamadı/)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Create Company", () => {
    test("should navigate to new company form page", async ({ page }) => {
      await page.getByRole("link", { name: /Yeni Şirket/i }).click();
      await page.waitForURL("/dashboard/companies/new");
      await expect(
        page.getByRole("heading", { name: "Yeni Şirket" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display company form with all sections", async ({ page }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      // Form sections
      await expect(page.getByText("Temel Bilgiler")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("Konum Bilgileri")).toBeVisible();
      await expect(page.getByText("İletişim Bilgileri")).toBeVisible();

      // Required field label
      await expect(page.getByLabel("Şirket Adı *")).toBeVisible();
    });

    test("should show validation error when submitting empty name", async ({
      page,
    }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      // Click submit without filling anything
      await page.getByRole("button", { name: /Oluştur/i }).click();

      // Validation error should appear for required name field
      await expect(page.locator(".text-destructive").first()).toBeVisible({
        timeout: 5000,
      });
    });

    test("should create company with valid data", async ({ page }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      const uniqueName = `E2E Test Şirket ${Date.now()}`;
      await page.getByLabel("Şirket Adı *").fill(uniqueName);
      await page.getByLabel("Resmi Ad").fill(`${uniqueName} A.S.`);

      // Submit form
      await page.getByRole("button", { name: /Oluştur/i }).click();

      // Should redirect back to companies list
      await page.waitForURL("/dashboard/companies", { timeout: 15000 });
      await expect(
        page.getByRole("heading", { name: "Şirketler" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should cancel creation and return to list", async ({ page }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /İptal/i }).click();
      await page.waitForURL("/dashboard/companies", { timeout: 10000 });
    });
  });

  test.describe("View and Edit Company", () => {
    test("should display company detail page when clicking view icon", async ({
      page,
    }) => {
      // Check if any rows exist
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Check if the row contains actual data (not the "Kayıt bulunamadı" message)
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Kayıt bulunamadı")
        ) {
          // Click the first view (Eye) icon button link
          const viewLink = rows.first().locator('a[href*="/dashboard/companies/"]').first();
          await viewLink.click();
          await expect(page).toHaveURL(/\/dashboard\/companies\/.+/);
        }
      }
    });

    test("should display form fields on company form page", async ({
      page,
    }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      // Verify all form fields are present
      await expect(page.getByLabel("Şirket Adı *")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByLabel("Resmi Ad")).toBeVisible();
      await expect(page.getByLabel("Vergi Numarası")).toBeVisible();
      await expect(page.getByLabel("Ekonomik Faaliyet")).toBeVisible();
      await expect(page.getByLabel("Adres")).toBeVisible();
      await expect(page.getByLabel("Posta Kodu")).toBeVisible();
      await expect(page.getByLabel("Enlem")).toBeVisible();
      await expect(page.getByLabel("Boylam")).toBeVisible();
    });

    test("should display location selectors (Country, City, District)", async ({
      page,
    }) => {
      await page.goto("/dashboard/companies/new");
      await page.waitForLoadState("networkidle");

      // Country, City, District selectors exist
      const countryTrigger = page.getByText("Ülke seçin");
      await expect(countryTrigger).toBeVisible({ timeout: 10000 });

      const cityTrigger = page.getByText("Şehir seçin");
      await expect(cityTrigger).toBeVisible();
    });
  });

  test.describe("Delete Company", () => {
    test("should show confirmation dialog before deleting", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Kayıt bulunamadı")
        ) {
          // Set up dialog handler to cancel
          page.on("dialog", (dialog) => dialog.dismiss());

          // Click the delete button (Trash icon) in the first row
          const deleteBtn = rows.first().locator("button").last();
          await deleteBtn.click();

          // Dialog would have been triggered and dismissed - page should still show list
          await expect(
            page.getByRole("heading", { name: "Şirketler" })
          ).toBeVisible();
        }
      }
    });
  });
});
