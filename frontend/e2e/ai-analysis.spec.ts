import { test, expect } from "@playwright/test";

test.describe("AI Analysis Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/ai-analysis");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Page Structure", () => {
    test("should display AI analysis page with heading", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "AI Analiz" })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(
          "Yapay zeka destekli emisyon analizi ve tahminler"
        )
      ).toBeVisible();
    });

    test("should display installation selector card", async ({ page }) => {
      await expect(page.getByText("Tesis Secin")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText("Analiz icin tesis secin")
      ).toBeVisible();
    });

    test("should display 3 tab triggers", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /Tahmin/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("tab", { name: /Anomali/i })
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /Rapor/i })
      ).toBeVisible();
    });
  });

  test.describe("Forecast Tab", () => {
    test("should display forecast tab content by default", async ({
      page,
    }) => {
      await expect(page.getByText("Emisyon Tahmini")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText(/XGBoost.*Linear Regression/i)
      ).toBeVisible();
    });

    test("should display forecast period selector", async ({ page }) => {
      await expect(
        page.getByText("Tahmin Donemi (yil)")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display 'Tahmin Olustur' button", async ({ page }) => {
      const forecastBtn = page.getByRole("button", {
        name: /Tahmin Olustur/i,
      });
      await expect(forecastBtn).toBeVisible({ timeout: 10000 });
    });

    test("should disable forecast button when no installation selected", async ({
      page,
    }) => {
      const forecastBtn = page.getByRole("button", {
        name: /Tahmin Olustur/i,
      });
      await expect(forecastBtn).toBeDisabled();
    });
  });

  test.describe("Anomaly Tab", () => {
    test("should switch to anomaly tab and display content", async ({
      page,
    }) => {
      await page.getByRole("tab", { name: /Anomali/i }).click();

      await expect(page.getByText("Anomali Tespiti")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText(/IsolationForest/i)
      ).toBeVisible();
    });

    test("should display 'Anomali Tara' button", async ({ page }) => {
      await page.getByRole("tab", { name: /Anomali/i }).click();

      const anomalyBtn = page.getByRole("button", {
        name: /Anomali Tara/i,
      });
      await expect(anomalyBtn).toBeVisible({ timeout: 10000 });
    });

    test("should disable anomaly button when no installation selected", async ({
      page,
    }) => {
      await page.getByRole("tab", { name: /Anomali/i }).click();

      const anomalyBtn = page.getByRole("button", {
        name: /Anomali Tara/i,
      });
      await expect(anomalyBtn).toBeDisabled();
    });
  });

  test.describe("Narrative/Report Tab", () => {
    test("should switch to narrative tab and display content", async ({
      page,
    }) => {
      await page.getByRole("tab", { name: /Rapor/i }).click();

      await expect(page.getByText("Akilli Raporlama")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText(/LangChain.*Claude.*GPT-4/i)
      ).toBeVisible();
    });

    test("should display report type and language selectors", async ({
      page,
    }) => {
      await page.getByRole("tab", { name: /Rapor/i }).click();

      await expect(page.getByText("Rapor Tipi")).toBeVisible({
        timeout: 10000,
      });
      // Dil label appears for language
      // Check that narrative-specific controls exist
      await expect(
        page.getByRole("button", { name: /Rapor Olustur/i })
      ).toBeVisible();
    });

    test("should disable report generation button when no installation selected", async ({
      page,
    }) => {
      await page.getByRole("tab", { name: /Rapor/i }).click();

      const reportBtn = page.getByRole("button", {
        name: /Rapor Olustur/i,
      });
      await expect(reportBtn).toBeDisabled();
    });
  });

  test.describe("Tab Navigation", () => {
    test("should cycle through all 3 tabs correctly", async ({ page }) => {
      // Start on Forecast (default)
      await expect(page.getByText("Emisyon Tahmini")).toBeVisible({
        timeout: 10000,
      });

      // Switch to Anomaly
      await page.getByRole("tab", { name: /Anomali/i }).click();
      await expect(page.getByText("Anomali Tespiti")).toBeVisible({
        timeout: 5000,
      });

      // Switch to Narrative/Report
      await page.getByRole("tab", { name: /Rapor/i }).click();
      await expect(page.getByText("Akilli Raporlama")).toBeVisible({
        timeout: 5000,
      });

      // Switch back to Forecast
      await page.getByRole("tab", { name: /Tahmin/i }).click();
      await expect(page.getByText("Emisyon Tahmini")).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
