import { describe, it, expect } from "vitest";
import { hasMinimumRole, canAccessRoute, getMenuItemsForRole } from "@/lib/auth/roles";

// Cast helper since UserRole is a Prisma enum
const role = (r: string) => r as Parameters<typeof hasMinimumRole>[0];

describe("hasMinimumRole", () => {
  it("SUPER_ADMIN has highest level", () => {
    expect(hasMinimumRole(role("SUPER_ADMIN"), role("SUPER_ADMIN"))).toBe(true);
    expect(hasMinimumRole(role("SUPER_ADMIN"), role("COMPANY_ADMIN"))).toBe(true);
    expect(hasMinimumRole(role("SUPER_ADMIN"), role("SUPPLIER"))).toBe(true);
  });

  it("COMPANY_ADMIN meets OPERATOR requirement", () => {
    expect(hasMinimumRole(role("COMPANY_ADMIN"), role("OPERATOR"))).toBe(true);
  });

  it("OPERATOR does not meet COMPANY_ADMIN requirement", () => {
    expect(hasMinimumRole(role("OPERATOR"), role("COMPANY_ADMIN"))).toBe(false);
  });

  it("SUPPLIER is lowest level", () => {
    expect(hasMinimumRole(role("SUPPLIER"), role("SUPPLIER"))).toBe(true);
    expect(hasMinimumRole(role("SUPPLIER"), role("OPERATOR"))).toBe(false);
    expect(hasMinimumRole(role("SUPPLIER"), role("SUPER_ADMIN"))).toBe(false);
  });

  it("same role meets its own requirement", () => {
    const roles = ["SUPPLIER", "VERIFIER", "CBAM_DECLARANT", "OPERATOR", "COMPANY_ADMIN", "SUPER_ADMIN"];
    for (const r of roles) {
      expect(hasMinimumRole(role(r), role(r))).toBe(true);
    }
  });

  it("role hierarchy is correct order", () => {
    // SUPPLIER < VERIFIER < CBAM_DECLARANT < OPERATOR < COMPANY_ADMIN < SUPER_ADMIN
    expect(hasMinimumRole(role("VERIFIER"), role("SUPPLIER"))).toBe(true);
    expect(hasMinimumRole(role("CBAM_DECLARANT"), role("VERIFIER"))).toBe(true);
    expect(hasMinimumRole(role("OPERATOR"), role("CBAM_DECLARANT"))).toBe(true);
  });
});

describe("canAccessRoute", () => {
  it("SUPER_ADMIN can access everything", () => {
    expect(canAccessRoute(role("SUPER_ADMIN"), "/dashboard")).toBe(true);
    expect(canAccessRoute(role("SUPER_ADMIN"), "/dashboard/settings/users")).toBe(true);
    expect(canAccessRoute(role("SUPER_ADMIN"), "/dashboard/ai-analysis")).toBe(true);
  });

  it("OPERATOR can access dashboard", () => {
    expect(canAccessRoute(role("OPERATOR"), "/dashboard")).toBe(true);
    expect(canAccessRoute(role("OPERATOR"), "/dashboard/suppliers")).toBe(true);
  });

  it("OPERATOR cannot access user management", () => {
    expect(canAccessRoute(role("OPERATOR"), "/dashboard/settings/users")).toBe(false);
  });

  it("COMPANY_ADMIN can access user management", () => {
    expect(canAccessRoute(role("COMPANY_ADMIN"), "/dashboard/settings/users")).toBe(true);
  });

  it("SUPPLIER can access base dashboard", () => {
    expect(canAccessRoute(role("SUPPLIER"), "/dashboard")).toBe(true);
  });

  it("SUPPLIER cannot access admin routes", () => {
    expect(canAccessRoute(role("SUPPLIER"), "/dashboard/suppliers")).toBe(false);
    expect(canAccessRoute(role("SUPPLIER"), "/dashboard/settings")).toBe(false);
  });

  it("CBAM_DECLARANT can access declarations", () => {
    expect(canAccessRoute(role("CBAM_DECLARANT"), "/dashboard/declarations")).toBe(true);
  });

  it("allows unknown routes by default", () => {
    expect(canAccessRoute(role("SUPPLIER"), "/some-unknown-route")).toBe(true);
  });
});

describe("getMenuItemsForRole", () => {
  it("SUPER_ADMIN sees everything including user management", () => {
    const items = getMenuItemsForRole(role("SUPER_ADMIN"));
    expect(items.showCompanies).toBe(true);
    expect(items.showUserManagement).toBe(true);
    expect(items.showAiAnalysis).toBe(true);
    expect(items.showSupplierPortal).toBe(false); // Only for SUPPLIER role
  });

  it("OPERATOR sees main items but not user management", () => {
    const items = getMenuItemsForRole(role("OPERATOR"));
    expect(items.showCompanies).toBe(true);
    expect(items.showInstallations).toBe(true);
    expect(items.showEmissions).toBe(true);
    expect(items.showUserManagement).toBe(false);
    expect(items.showSupplierPortal).toBe(false);
  });

  it("SUPPLIER only sees supplier portal", () => {
    const items = getMenuItemsForRole(role("SUPPLIER"));
    expect(items.showSupplierPortal).toBe(true);
    expect(items.showCompanies).toBe(false);
    expect(items.showInstallations).toBe(false);
    expect(items.showUserManagement).toBe(false);
  });

  it("CBAM_DECLARANT sees declarations", () => {
    const items = getMenuItemsForRole(role("CBAM_DECLARANT"));
    expect(items.showDeclarations).toBe(true);
    expect(items.showCompanies).toBe(false);
  });
});
