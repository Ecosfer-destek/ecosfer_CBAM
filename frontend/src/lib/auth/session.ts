import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTenantClient } from "@/lib/db-tenant";
import { UserRole } from "@prisma/client";
import { hasMinimumRole } from "./roles";

/**
 * Get the current session. Throws redirect to /login if not authenticated.
 * Use this in Server Components and Server Actions.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Get session or null (doesn't redirect).
 */
export async function getSession() {
  return auth();
}

/**
 * Require a minimum role level. Redirects to /dashboard if insufficient.
 */
export async function requireRole(minimumRole: UserRole) {
  const session = await requireAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any).role as UserRole;

  if (!hasMinimumRole(userRole, minimumRole)) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * Get a tenant-scoped Prisma client for the current user.
 * This ensures all queries are automatically filtered by tenantId.
 */
export async function getTenantDb() {
  const session = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (session.user as any).tenantId as string;

  return {
    db: createTenantClient(tenantId),
    session,
    tenantId,
  };
}
