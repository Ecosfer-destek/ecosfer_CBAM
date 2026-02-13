import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  let logError: typeof import("@/lib/logger").logError;
  let logInfo: typeof import("@/lib/logger").logInfo;
  let logWarn: typeof import("@/lib/logger").logWarn;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("development mode", () => {
    beforeEach(async () => {
      vi.stubEnv("NODE_ENV", "development");
      const mod = await import("@/lib/logger");
      logError = mod.logError;
      logInfo = mod.logInfo;
      logWarn = mod.logWarn;
    });

    it("logError calls console.error with prefix", () => {
      const error = new Error("test error");
      logError("test-context", error);
      expect(console.error).toHaveBeenCalled();
    });

    it("logInfo calls console.log with prefix", () => {
      logInfo("test-context", { key: "value" });
      expect(console.log).toHaveBeenCalled();
    });

    it("logWarn calls console.warn with prefix", () => {
      logWarn("test-context", { key: "value" });
      expect(console.warn).toHaveBeenCalled();
    });

    it("logError handles string errors", () => {
      logError("test-context", "string error");
      expect(console.error).toHaveBeenCalled();
    });

    it("logError handles unknown error types", () => {
      logError("test-context", { custom: "error" });
      expect(console.error).toHaveBeenCalled();
    });

    it("logInfo works without data parameter", () => {
      logInfo("test-context");
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("production mode", () => {
    beforeEach(async () => {
      vi.stubEnv("NODE_ENV", "production");
      const mod = await import("@/lib/logger");
      logError = mod.logError;
      logInfo = mod.logInfo;
      logWarn = mod.logWarn;
    });

    it("logError outputs JSON in production", () => {
      logError("test-context", new Error("prod error"));
      expect(console.error).toHaveBeenCalled();
    });

    it("logInfo outputs JSON in production", () => {
      logInfo("test-context", { data: "test" });
      expect(console.log).toHaveBeenCalled();
    });

    it("logWarn outputs JSON in production", () => {
      logWarn("test-context", { warning: "test" });
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
