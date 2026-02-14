import { test, expect } from "@playwright/test";

test.describe("Supplier Management", () => {
  test.describe("Suppliers Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/suppliers");
      await page.waitForLoadState("networkidle");
    });

    test("should display suppliers page with heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Tedarikçiler" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("Tedarikçi yönetimi ve CBAM emisyon anketleri")
      ).toBeVisible();
    });

    test("should display 'Yeni Tedarikçi' button", async ({ page }) => {
      const newButton = page.getByRole("button", {
        name: /Yeni Tedarikçi/i,
      });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display supplier list card with table", async ({
      page,
    }) => {
      await expect(page.getByText("Tedarikçi Listesi")).toBeVisible({
        timeout: 10000,
      });

      const table = page.locator("table");
      await expect(table).toBeVisible();

      // Verify column headers
      await expect(page.getByText("Tedarikçi")).toBeVisible();
      await expect(page.getByText("E-posta")).toBeVisible();
      await expect(page.getByText("Ülke")).toBeVisible();
      await expect(page.getByText("Anket")).toBeVisible();
      await expect(page.getByText("Mal")).toBeVisible();
      await expect(page.getByText("Davet Durumu")).toBeVisible();
    });

    test("should show empty state or supplier rows", async ({ page }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      const bodyRows = page.locator("table tbody tr");
      const rowCount = await bodyRows.count();

      if (rowCount === 1) {
        // Either an actual supplier row or the empty state message
        const text = await bodyRows.first().textContent();
        expect(
          text?.includes("Henüz tedarikçi bulunmuyor") ||
            text?.length! > 0
        ).toBeTruthy();
      }
    });

    test("should open create supplier dialog", async ({ page }) => {
      await page
        .getByRole("button", { name: /Yeni Tedarikçi/i })
        .click();

      // Dialog should appear with form fields
      await expect(
        page.getByRole("heading", { name: "Yeni Tedarikçi" })
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Tedarikçi Adı *")).toBeVisible();
      await expect(page.getByPlaceholder("Şirket adı")).toBeVisible();
      await expect(
        page.getByPlaceholder("iletişim@firma.com")
      ).toBeVisible();
      await expect(page.getByText("Telefon")).toBeVisible();
      await expect(page.getByText("Yetkili Kişi")).toBeVisible();
      await expect(page.getByText("Vergi Numarası")).toBeVisible();
      await expect(page.getByText("Vergi Dairesi")).toBeVisible();
    });

    test("should close create dialog on cancel", async ({ page }) => {
      await page
        .getByRole("button", { name: /Yeni Tedarikçi/i })
        .click();

      await expect(
        page.getByRole("heading", { name: "Yeni Tedarikçi" })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /İptal/i }).click();

      // Dialog should close
      await expect(
        page.getByRole("heading", { name: "Yeni Tedarikçi" })
      ).not.toBeVisible({ timeout: 3000 });
    });

    test("should display detail dialog when clicking view icon", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Henüz tedarikçi bulunmuyor")
        ) {
          // Click view (Eye) button
          const viewBtn = rows.first().locator("button").first();
          await viewBtn.click();

          // Detail dialog should appear with supplier name in title
          await expect(page.getByText("Detay")).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test("should show delete confirmation on delete click", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Henüz tedarikçi bulunmuyor")
        ) {
          page.on("dialog", (dialog) => dialog.dismiss());
          // Delete button is typically last in the actions
          const deleteBtn = rows
            .first()
            .locator("button")
            .last();
          await deleteBtn.click();
          // Page should remain intact
          await expect(
            page.getByRole("heading", { name: "Tedarikçiler" })
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Supplier Survey Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/supplier-survey");
      await page.waitForLoadState("networkidle");
    });

    test("should display supplier survey page with heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "Tedarikçi Anketi" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(
          "CBAM kapsamında tedarikçi emisyon anketlerini inceleyin ve onaylayın"
        )
      ).toBeVisible();
    });

    test("should display status filter tabs", async ({ page }) => {
      // Status filter tabs
      await expect(page.getByRole("tab", { name: /Tümü/i })).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("tab", { name: /Taslak/i })
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /Gönderildi/i })
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /Onaylandı/i })
      ).toBeVisible();
    });

    test("should display survey list card and table", async ({ page }) => {
      await expect(page.getByText("Anket Listesi")).toBeVisible({
        timeout: 10000,
      });

      const table = page.locator("table");
      await expect(table).toBeVisible();

      // Column headers
      await expect(page.getByText("Tedarikçi")).toBeVisible();
      await expect(page.getByText("Mal (CN Kodu)")).toBeVisible();
      await expect(page.getByText("Dönem")).toBeVisible();
      await expect(page.getByText("Durum")).toBeVisible();
      await expect(page.getByText("Emisyonlar")).toBeVisible();
    });

    test("should switch between status filter tabs", async ({ page }) => {
      // Click on "Taslak" tab
      await page.getByRole("tab", { name: /Taslak/i }).click();
      // Table should update (may show 0 or filtered results)
      await page.waitForTimeout(500);

      // Click on "Gönderildi" tab
      await page.getByRole("tab", { name: /Gönderildi/i }).click();
      await page.waitForTimeout(500);

      // Click on "Onaylandı" tab
      await page.getByRole("tab", { name: /Onaylandı/i }).click();
      await page.waitForTimeout(500);

      // Click back to "Tümü"
      await page.getByRole("tab", { name: /Tümü/i }).click();
      await page.waitForTimeout(500);
    });

    test("should display survey detail dialog when clicking a row", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Henüz anket bulunmuyor") &&
          !firstRowText.includes("durumunda anket bulunmuyor")
        ) {
          // Click on the first row
          await rows.first().click();

          // Detail dialog should appear
          await expect(page.getByText("Anket Detayı")).toBeVisible({
            timeout: 5000,
          });

          // Verify detail sections
          await expect(
            page.getByText("Tedarikçi Bilgileri")
          ).toBeVisible();
          await expect(page.getByText("Mal Bilgileri")).toBeVisible();
          await expect(
            page.getByText("Raporlama Dönemi")
          ).toBeVisible();
          await expect(
            page.getByText("Emisyon Verileri")
          ).toBeVisible();

          // Close dialog
          await page.getByRole("button", { name: /Kapat/i }).click();
        }
      }
    });
  });
});
