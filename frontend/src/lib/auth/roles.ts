import { UserRole } from "@prisma/client";

/**
 * Role hierarchy - higher index = more permissions.
 * SUPER_ADMIN has access to everything.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  SUPPLIER: 1,
  VERIFIER: 2,
  CBAM_DECLARANT: 3,
  OPERATOR: 4,
  COMPANY_ADMIN: 5,
  SUPER_ADMIN: 6,
};

/**
 * Check if a role has at least the minimum required role level.
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

/**
 * Role-based route access rules.
 * Maps route patterns to minimum required roles.
 */
const ROUTE_ACCESS: Record<string, UserRole> = {
  "/dashboard/settings/users": "COMPANY_ADMIN" as UserRole,
  "/dashboard/settings": "OPERATOR" as UserRole,
  "/dashboard/suppliers": "OPERATOR" as UserRole,
  "/dashboard/ai-analysis": "OPERATOR" as UserRole,
  "/dashboard/cbam-reference-data": "OPERATOR" as UserRole,
  "/dashboard/declarations": "CBAM_DECLARANT" as UserRole,
  "/dashboard/verification": "VERIFIER" as UserRole,
  "/dashboard": "SUPPLIER" as UserRole,
};

/**
 * Check if a user role can access a specific route.
 */
export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  // SUPER_ADMIN can access everything
  if (userRole === "SUPER_ADMIN") return true;

  // Find the most specific matching route pattern
  const sortedRoutes = Object.keys(ROUTE_ACCESS).sort(
    (a, b) => b.length - a.length
  );

  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return hasMinimumRole(userRole, ROUTE_ACCESS[route]);
    }
  }

  // Default: allow if no rule matches
  return true;
}

/**
 * Get sidebar menu items filtered by user role.
 */
export function getMenuItemsForRole(userRole: UserRole) {
  const isAdmin = hasMinimumRole(userRole, "COMPANY_ADMIN" as UserRole);
  const isOperator = hasMinimumRole(userRole, "OPERATOR" as UserRole);
  const isDeclarant = hasMinimumRole(userRole, "CBAM_DECLARANT" as UserRole);
  const isSupplier = userRole === ("SUPPLIER" as UserRole);

  return {
    showCompanies: isOperator,
    showInstallations: isOperator,
    showInstallationData: isOperator,
    showEmissions: isOperator,
    showProductionProcesses: isOperator,
    showReports: isOperator,
    showDeclarations: isDeclarant || isOperator,
    showVerification: isOperator,
    showSuppliers: isOperator,
    showAiAnalysis: isOperator,
    showCbamReferenceData: isOperator,
    showSettings: isOperator,
    showUserManagement: isAdmin,
    showSupplierPortal: isSupplier,
  };
}
