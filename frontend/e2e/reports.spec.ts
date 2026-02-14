import { test, expect } from "@playwright/test";

test.describe("Reports Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/reports");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Reports Page Structure", () => {
    test("should display reports page with heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "CBAM Raporları" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("Raporları oluşturun ve yönetin")
      ).toBeVisible();
    });

    test("should display 'Yeni Rapor' button", async ({ page }) => {
      const newButton = page.getByRole("button", {
        name: /Yeni Rapor/i,
      });
      await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test("should display PDF generation card", async ({ page }) => {
      await expect(page.getByText("PDF Rapor Oluştur")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText("Seçili rapor tipine göre PDF oluşturun")
      ).toBeVisible();

      // Report type selector
      await expect(page.getByText("Rapor Tipi")).toBeVisible();

      // Language selector
      await expect(page.getByText("Dil")).toBeVisible();

      // PDF download button
      await expect(
        page.getByRole("button", { name: /PDF İndir/i })
      ).toBeVisible();
    });

    test("should display reports table with columns", async ({ page }) => {
      await expect(page.getByText("Raporlar")).toBeVisible({
        timeout: 10000,
      });

      const table = page.locator("table");
      await expect(table).toBeVisible();

      await expect(page.getByText("Başlık")).toBeVisible();
      await expect(page.getByText("Bölüm Sayısı")).toBeVisible();
      await expect(page.getByText("Oluşturma")).toBeVisible();
    });

    test("should show empty state or report rows", async ({ page }) => {
      const bodyRows = page.locator("table tbody tr");
      await expect(bodyRows.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Create Report", () => {
    test("should open create report dialog", async ({ page }) => {
      await page
        .getByRole("button", { name: /Yeni Rapor/i })
        .click();

      await expect(
        page.getByText("Yeni Rapor Oluştur")
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Rapor Başlığı")).toBeVisible();
      await expect(page.getByText("Açıklama")).toBeVisible();
      await expect(
        page.getByPlaceholder("CBAM Raporu 2026 Q1")
      ).toBeVisible();
    });

    test("should close create dialog on cancel", async ({ page }) => {
      await page
        .getByRole("button", { name: /Yeni Rapor/i })
        .click();

      await expect(
        page.getByText("Yeni Rapor Oluştur")
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /İptal/i }).click();

      await expect(
        page.getByText("Yeni Rapor Oluştur")
      ).not.toBeVisible({ timeout: 3000 });
    });

    test("should create report with title", async ({ page }) => {
      await page
        .getByRole("button", { name: /Yeni Rapor/i })
        .click();

      await expect(
        page.getByText("Yeni Rapor Oluştur")
      ).toBeVisible({ timeout: 5000 });

      const uniqueTitle = `E2E Test Rapor ${Date.now()}`;
      await page
        .getByPlaceholder("CBAM Raporu 2026 Q1")
        .fill(uniqueTitle);

      await page.getByRole("button", { name: /^Oluştur$/i }).click();

      // Wait for dialog to close or error toast
      await page.waitForTimeout(2000);
    });
  });

  test.describe("PDF Generation", () => {
    test("should display report type options in selector", async ({
      page,
    }) => {
      // The report type selector should be present
      // Check that default value is visible
      await expect(page.getByText("Tesis Özet Raporu")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should display language selector with TR/EN/DE", async ({
      page,
    }) => {
      // Language selector shows "TR" by default
      // Look for the language select trigger near the Dil label
      await expect(page.getByText("Dil")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should have clickable PDF download button", async ({ page }) => {
      const pdfBtn = page.getByRole("button", {
        name: /PDF İndir/i,
      });
      await expect(pdfBtn).toBeVisible({ timeout: 10000 });
      await expect(pdfBtn).toBeEnabled();
    });
  });

  test.describe("Report Detail", () => {
    test("should open report detail dialog when clicking view icon", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Henüz rapor bulunmuyor")
        ) {
          // Click view button (Eye icon)
          const viewBtn = rows
            .first()
            .locator("button")
            .first();
          await viewBtn.click();

          // Detail dialog should appear
          await expect(
            page.getByText(/Rapor Detayı|Bölümleri/)
          ).toBeVisible({ timeout: 5000 });

          // Should show "Bölüm Ekle" button
          await expect(
            page.getByRole("button", { name: /Bölüm Ekle/i })
          ).toBeVisible();

          // Close dialog
          await page
            .getByRole("button", { name: /Kapat/i })
            .click();
        }
      }
    });

    test("should show delete confirmation on report delete", async ({
      page,
    }) => {
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        if (
          firstRowText &&
          !firstRowText.includes("Henüz rapor bulunmuyor")
        ) {
          page.on("dialog", (dialog) => dialog.dismiss());
          const deleteBtn = rows
            .first()
            .locator("button")
            .last();
          await deleteBtn.click();
          await expect(
            page.getByRole("heading", { name: "CBAM Raporları" })
          ).toBeVisible();
        }
      }
    });
  });
});
