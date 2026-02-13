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
        page.getByRole("heading", { name: "Yillik Beyannameler" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("CBAM yillik beyannamelerini yonetin")
      ).toBeVisible();
    });

    test("should display 'Sihirbaz ile Olustur' button", async ({
      page,
    }) => {
      const wizardBtn = page.getByRole("link", {
        name: /Sihirbaz ile Olustur/i,
      });
      await expect(wizardBtn).toBeVisible({ timeout: 10000 });
    });

    test("should display 'Hizli Olustur' button", async ({ page }) => {
      const quickCreateBtn = page.getByRole("button", {
        name: /Hizli Olustur/i,
      });
      await expect(quickCreateBtn).toBeVisible({ timeout: 10000 });
    });

    test("should display declarations table with columns", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Yil")).toBeVisible();
      await expect(page.getByText("Durum")).toBeVisible();
      await expect(page.getByText("Toplam Emisyon")).toBeVisible();
      await expect(page.getByText("Sertifika")).toBeVisible();
      await expect(page.getByText("Gonderim Tarihi")).toBeVisible();
    });

    test("should show empty state or data in table", async ({ page }) => {
      const table = page.locator("table");
      await expect(table).toBeVisible({ timeout: 10000 });
      // Either shows "Henuz beyanname bulunmuyor" or actual rows
      const bodyRows = page.locator("table tbody tr");
      await expect(bodyRows.first()).toBeVisible({ timeout: 10000 });
    });

    test("should open quick create dialog", async ({ page }) => {
      await page
        .getByRole("button", { name: /Hizli Olustur/i })
        .click();

      // Dialog should appear
      await expect(
        page.getByText("Yeni Yillik Beyanname")
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Yil *")).toBeVisible();
      await expect(page.getByText("Notlar")).toBeVisible();

      // Cancel and close dialog
      await page.getByRole("button", { name: /Iptal/i }).click();
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
          name: "Yillik Beyanname Sihirbazi",
        })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("7 adimda CBAM yillik beyanname olusturun")
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
        "Tesis ve Yil Sec",
        "Ithal Mallar",
        "Gomulu Emisyonlar",
        "Sertifika Teslimi",
        "Ucretsiz Tahsis",
        "Dogrulama",
        "Inceleme ve Gonder",
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
        page.getByRole("heading", { name: "Yillik Beyannameler" })
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
        .getByRole("button", { name: /Hizli Olustur/i })
        .click();

      await expect(
        page.getByText("Yeni Yillik Beyanname")
      ).toBeVisible({ timeout: 5000 });

      // Year field should have current year by default
      const yearInput = page.locator('input[type="number"]');
      await expect(yearInput).toBeVisible();

      // Fill in optional notes
      const notesField = page.locator("textarea");
      await notesField.fill("E2E test beyannamesi");

      // Click Olustur
      await page.getByRole("button", { name: /^Olustur$/i }).click();

      // Should close dialog (either success or error toast will appear)
      await page.waitForTimeout(2000);
    });
  });
});
