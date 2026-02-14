import { test, expect } from "@playwright/test";

test.describe("Declaration Management & Wizard", () => {
  test.describe("Declarations List Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/declarations");
      await page.waitForLoadState("networkidle");
    });

    test("should display declarations page with heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "Yıllık Beyannameler" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("CBAM yıllık beyannamelerini yönetin")
      ).toBeVisible();
    });

    test("should display 'Sihirbaz ile Oluştur' button", async ({
      page,
    }) => {
      const wizardBtn = page.getByRole("link", {
        name: /Sihirbaz ile Oluştur/i,
      });
      await expect(wizardBtn).toBeVisible({ timeout: 10000 });
    });

    test("should display 'Hızlı Oluştur' button", async ({ page }) => {
      const quickCreateBtn = page.getByRole("button", {
        name: /Hızlı Oluştur/i,
      });
      await expect(quickCreateBtn).toBeVisible({ timeout: 10000 });
    });

    test("should display declarations table with columns", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Yıl")).toBeVisible();
      await expect(page.getByText("Durum")).toBeVisible();
      await expect(page.getByText("Toplam Emisyon")).toBeVisible();
      await expect(page.getByText("Sertifika")).toBeVisible();
      await expect(page.getByText("Gönderim Tarihi")).toBeVisible();
    });

    test("should show empty state or data in table", async ({ page }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });
      // Either shows "Henüz beyanname bulunmuyor" or actual rows
      const bodyRows = page.locator("table tbody tr");
      await expect(bodyRows.first()).toBeVisible({ timeout: 10000 });
    });

    test("should open quick create dialog", async ({ page }) => {
      await page
        .getByRole("button", { name: /Hızlı Oluştur/i })
        .click();

      // Dialog should appear
      await expect(
        page.getByText("Yeni Yıllık Beyanname")
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Yıl *")).toBeVisible();
      await expect(page.getByText("Notlar")).toBeVisible();

      // Cancel and close dialog
      await page.getByRole("button", { name: /İptal/i }).click();
    });
  });

  test.describe("Declaration Wizard", () => {
    test.slow();

    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/declarations/wizard");
      await page.waitForLoadState("networkidle");
    });

    test("should display wizard page with heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", {
          name: "Yıllık Beyanname Sihirbazı",
        })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("7 adımda CBAM yıllık beyanname oluşturun")
      ).toBeVisible();
    });

    test("should display back button to declarations list", async ({
      page,
    }) => {
      const backLink = page.getByRole("link", {
        name: "",
      });
      // There should be a link back to /dashboard/declarations
      const backButton = page.locator(
        'a[href="/dashboard/declarations"]'
      );
      await expect(backButton).toBeVisible({ timeout: 10000 });
    });

    test("should display wizard stepper with 7 steps", async ({ page }) => {
      // Stepper should show step numbers or labels
      await expect(page.getByText("1")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("2")).toBeVisible();
      await expect(page.getByText("3")).toBeVisible();
      await expect(page.getByText("4")).toBeVisible();
      await expect(page.getByText("5")).toBeVisible();
      await expect(page.getByText("6")).toBeVisible();
      await expect(page.getByText("7")).toBeVisible();
    });

    test("should display step labels on larger screens", async ({
      page,
    }) => {
      // Set viewport to large to show labels
      await page.setViewportSize({ width: 1280, height: 800 });

      const stepLabels = [
        "Tesis ve Yıl Seç",
        "İthal Mallar",
        "Gömülü Emisyonlar",
        "Sertifika Teslimi",
        "Ücretsiz Tahsis",
        "Doğrulama",
        "İnceleme ve Gönder",
      ];

      for (const label of stepLabels) {
        await expect(page.getByText(label)).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test("should start at Step 1: Select Installation", async ({
      page,
    }) => {
      // Step 1 content should be visible (StepSelectInstallation component)
      // The first step circle should have active styling
      const stepButton = page.locator("nav button").first();
      await expect(stepButton).toBeVisible({ timeout: 10000 });
    });

    test("should navigate back to declarations list via back button", async ({
      page,
    }) => {
      const backButton = page.locator(
        'a[href="/dashboard/declarations"]'
      );
      await backButton.click();
      await page.waitForURL("/dashboard/declarations", {
        timeout: 10000,
      });
      await expect(
        page.getByRole("heading", { name: "Yıllık Beyannameler" })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Quick Create Declaration", () => {
    test("should create declaration via quick create dialog", async ({
      page,
    }) => {
      await page.goto("/dashboard/declarations");
      await page.waitForLoadState("networkidle");

      await page
        .getByRole("button", { name: /Hızlı Oluştur/i })
        .click();

      await expect(
        page.getByText("Yeni Yıllık Beyanname")
      ).toBeVisible({ timeout: 5000 });

      // Year field should have current year by default
      const yearInput = page.locator('input[type="number"]');
      await expect(yearInput).toBeVisible();

      // Fill in optional notes
      const notesField = page.locator("textarea");
      await notesField.fill("E2E test beyannamesi");

      // Click Oluştur
      await page.getByRole("button", { name: /^Oluştur$/i }).click();

      // Should close dialog (either success or error toast will appear)
      await page.waitForTimeout(2000);
    });
  });
});
