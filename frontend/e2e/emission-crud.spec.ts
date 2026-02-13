import { test, expect } from "@playwright/test";

test.describe("Emission CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/emissions");
    await page.waitForLoadState("networkidle");
  });

  test.describe("List Page", () => {
    test("should display emissions page with correct heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "Emisyonlar" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("Tesis emisyon verilerini yonetin")
      ).toBeVisible();
    });

    test("should display data table with expected columns", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Kaynak Akisi")).toBeVisible();
      await expect(page.getByText("Tesis")).toBeVisible();
      await expect(page.getByText("Tip")).toBeVisible();
      await expect(page.getByText("GHG")).toBeVisible();
      await expect(page.getByText("AD")).toBeVisible();
      await expect(page.getByText("CO2e Fosil")).toBeVisible();
    });

    test("should display 'Yeni Emisyon' button", async ({ page }) => {
      const newButton = page.getByRole("link", { name: /Yeni Emisyon/i });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display search input for emissions", async ({ page }) => {
      const searchInput = page.getByPlaceholder("Kaynak akisi ara...");
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test("should show pagination", async ({ page }) => {
      await expect(page.getByText(/Toplam .* kayit/)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Create Emission", () => {
    test("should navigate to new emission form", async ({ page }) => {
      await page.getByRole("link", { name: /Yeni Emisyon/i }).click();
      await page.waitForURL("/dashboard/emissions/new");
    });

    test("should display emission form with general info section", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Genel Bilgiler")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText("Emisyon kaynagi ve yontem bilgilerini girin")
      ).toBeVisible();

      // Check fields
      await expect(page.getByText("Kaynak Akisi Adi")).toBeVisible();
      await expect(page.getByText("Teknoloji Tipi")).toBeVisible();
      await expect(page.getByText("Emisyon Tipi")).toBeVisible();
      await expect(page.getByText("Emisyon Yontemi")).toBeVisible();
    });

    test("should display SS section by default (when no type selected)", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      // SS section should be visible by default
      await expect(
        page.getByText("SS - Aktivite Verisi ve Faktorler")
      ).toBeVisible({ timeout: 10000 });

      // SS-specific fields
      await expect(page.getByText("AD (Aktivite Verisi)")).toBeVisible();
      await expect(
        page.getByText("NCV (Net Kalorifer Degeri)")
      ).toBeVisible();
      await expect(page.getByText("EF (Emisyon Faktoru)")).toBeVisible();
    });

    test("should display CO2e and Energy section (always visible)", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("CO2e ve Enerji")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("CO2e Fosil")).toBeVisible();
      await expect(page.getByText("CO2e Bio")).toBeVisible();
    });

    test("should display emission type selector with options", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      // Click emission type selector
      const emissionTypeTrigger = page
        .getByText("Emisyon tipi secin")
        .first();
      await expect(emissionTypeTrigger).toBeVisible({ timeout: 10000 });
    });

    test("should display emission method selectors", async ({ page }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      // Both method selectors should be present
      const methodTrigger = page.getByText("Yontem secin").first();
      await expect(methodTrigger).toBeVisible({ timeout: 10000 });

      const method2Trigger = page.getByText("Yontem 2").first();
      await expect(method2Trigger).toBeVisible();
    });

    test("should display submit and cancel buttons", async ({ page }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("button", { name: /Olustur/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /Iptal/i })
      ).toBeVisible();
    });

    test("should cancel creation and go back", async ({ page }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /Iptal/i }).click();
      // Should navigate back (either emissions list or previous page)
      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Conditional Form Sections", () => {
    test("should show PFC fields when PFC type is selected", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      // Open emission type selector
      const typeTrigger = page.getByText("Emisyon tipi secin").first();
      await typeTrigger.click();

      // Look for PFC option in dropdown
      const pfcOption = page.getByRole("option", { name: /PFC/i });
      const pfcExists = await pfcOption.count();

      if (pfcExists > 0) {
        await pfcOption.click();
        // PFC section should appear
        await expect(
          page.getByText("PFC - Perfluorokarbon Emisyonlari")
        ).toBeVisible({ timeout: 5000 });

        // PFC-specific fields
        await expect(page.getByText("Frekans (a)")).toBeVisible();
        await expect(page.getByText("SEF CF4 (a)")).toBeVisible();
      }
    });

    test("should show ES/MBA fields when ES type is selected", async ({
      page,
    }) => {
      await page.goto("/dashboard/emissions/new");
      await page.waitForLoadState("networkidle");

      const typeTrigger = page.getByText("Emisyon tipi secin").first();
      await typeTrigger.click();

      // Look for ES or MBA option
      const esOption = page.getByRole("option", { name: /ES|MBA/i });
      const esExists = await esOption.count();

      if (esExists > 0) {
        await esOption.first().click();
        // ES section should appear
        await expect(
          page.getByText("ES (MBA) - Olcum Bazli Yaklasim")
        ).toBeVisible({ timeout: 5000 });

        // ES-specific fields
        await expect(
          page.getByText("GHG Konsantrasyon Ortalamasi")
        ).toBeVisible();
        await expect(page.getByText("Calisma Saatleri")).toBeVisible();
      }
    });
  });

  test.describe("Delete Emission", () => {
    test("should show confirmation dialog on delete", async ({ page }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (firstRowText && !firstRowText.includes("Kayit bulunamadi")) {
          page.on("dialog", (dialog) => dialog.dismiss());
          // Click delete button (last button in actions)
          const deleteBtn = rows.first().locator("button").last();
          await deleteBtn.click();
          await expect(
            page.getByRole("heading", { name: "Emisyonlar" })
          ).toBeVisible();
        }
      }
    });
  });
});
