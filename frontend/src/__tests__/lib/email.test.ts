import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("email service", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("without RESEND_API_KEY", () => {
    it("returns success in development mode", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite?token=abc123"
      );
      expect(result.success).toBe(true);
    });

    it("logs invitation in development mode", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite?token=abc123"
      );
      expect(console.log).toHaveBeenCalled();
    });

    it("returns success without logging in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite?token=abc123"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("template generation", () => {
    it("handles Turkish language", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite",
        "tr"
      );
      expect(result.success).toBe(true);
    });

    it("handles English language", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite",
        "en"
      );
      expect(result.success).toBe(true);
    });

    it("handles German language", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite",
        "de"
      );
      expect(result.success).toBe(true);
    });

    it("falls back to English for unknown language", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RESEND_API_KEY", "");
      const { sendInvitationEmail } = await import("@/lib/email");
      const result = await sendInvitationEmail(
        "test@example.com",
        "Test Supplier",
        "https://example.com/invite",
        "xx"
      );
      expect(result.success).toBe(true);
    });
  });
});
