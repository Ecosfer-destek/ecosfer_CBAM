import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth/session module
vi.mock("@/lib/auth/session", () => ({
  getTenantDb: vi.fn(),
}));

import { getDashboardStats, getRecentActivity } from "@/actions/dashboard";
import { getTenantDb } from "@/lib/auth/session";

describe("dashboard actions", () => {
  const mockDb = {
    company: { count: vi.fn() },
    installation: { count: vi.fn() },
    emission: { count: vi.fn() },
    report: { count: vi.fn() },
    declaration: { count: vi.fn(), findMany: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantDb).mockResolvedValue({
      db: mockDb as never,
      session: {} as never,
      tenantId: "test-tenant",
    });
  });

  describe("getDashboardStats", () => {
    it("returns counts for all entities", async () => {
      mockDb.company.count.mockResolvedValue(5);
      mockDb.installation.count.mockResolvedValue(10);
      mockDb.emission.count.mockResolvedValue(50);
      mockDb.report.count.mockResolvedValue(3);
      mockDb.declaration.count.mockResolvedValue(2);

      const stats = await getDashboardStats();

      expect(stats).toEqual({
        companies: 5,
        installations: 10,
        emissions: 50,
        reports: 3,
        declarations: 2,
      });
    });

    it("returns zero counts for empty database", async () => {
      mockDb.company.count.mockResolvedValue(0);
      mockDb.installation.count.mockResolvedValue(0);
      mockDb.emission.count.mockResolvedValue(0);
      mockDb.report.count.mockResolvedValue(0);
      mockDb.declaration.count.mockResolvedValue(0);

      const stats = await getDashboardStats();

      expect(stats.companies).toBe(0);
      expect(stats.installations).toBe(0);
      expect(stats.emissions).toBe(0);
    });

    it("calls count on all models", async () => {
      mockDb.company.count.mockResolvedValue(0);
      mockDb.installation.count.mockResolvedValue(0);
      mockDb.emission.count.mockResolvedValue(0);
      mockDb.report.count.mockResolvedValue(0);
      mockDb.declaration.count.mockResolvedValue(0);

      await getDashboardStats();

      expect(mockDb.company.count).toHaveBeenCalledOnce();
      expect(mockDb.installation.count).toHaveBeenCalledOnce();
      expect(mockDb.emission.count).toHaveBeenCalledOnce();
      expect(mockDb.report.count).toHaveBeenCalledOnce();
      expect(mockDb.declaration.count).toHaveBeenCalledOnce();
    });
  });

  describe("getRecentActivity", () => {
    it("returns recent declarations and reports", async () => {
      const mockDeclarations = [
        { id: "1", declarationId: "DEC-001", status: "DRAFT", createdAt: new Date() },
      ];
      const mockReports = [
        { id: "1", coverTitle: "Report 1", createdAt: new Date() },
      ];

      mockDb.declaration.findMany.mockResolvedValue(mockDeclarations);
      // Add report findMany to mock
      const mockReportDb = { ...mockDb, report: { ...mockDb.report, findMany: vi.fn().mockResolvedValue(mockReports) } };
      vi.mocked(getTenantDb).mockResolvedValue({
        db: mockReportDb as never,
        session: {} as never,
        tenantId: "test-tenant",
      });

      const activity = await getRecentActivity();

      expect(activity.recentDeclarations).toHaveLength(1);
      expect(activity.recentReports).toHaveLength(1);
    });

    it("returns empty arrays for no data", async () => {
      mockDb.declaration.findMany.mockResolvedValue([]);
      const mockReportDb = { ...mockDb, report: { ...mockDb.report, findMany: vi.fn().mockResolvedValue([]) } };
      vi.mocked(getTenantDb).mockResolvedValue({
        db: mockReportDb as never,
        session: {} as never,
        tenantId: "test-tenant",
      });

      const activity = await getRecentActivity();

      expect(activity.recentDeclarations).toHaveLength(0);
      expect(activity.recentReports).toHaveLength(0);
    });
  });
});
