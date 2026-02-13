import { prisma } from "@/lib/db";

/**
 * Domain -> Tenant mapping for multi-tenant resolution.
 * When a user logs in, their email domain is used to find the matching tenant.
 *
 * Migration from v1.0 TenantByEmailResolver:
 * - SP_ecosfercomtr -> ecosfer.com
 * - SP_rodercomtr -> roder.com
 * - SP_borubarcomtr -> borubar.com
 */

/**
 * Resolves tenantId from email domain.
 * Falls back to checking user's existing tenant assignment.
 */
export async function resolveTenantByEmail(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  // Try to find tenant by domain
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { domain },
        { domain: domain.replace(".", "") }, // ecosfercomtr -> ecosfer.com fallback
      ],
      isActive: true,
    },
    select: { id: true },
  });

  if (tenant) return tenant.id;

  // If no tenant matches domain, check if user already has a tenant assignment
  const user = await prisma.user.findUnique({
    where: { email },
    select: { tenantId: true },
  });

  return user?.tenantId ?? null;
}

/**
 * Resolves tenant by slug (for registration, admin operations).
 */
export async function resolveTenantBySlug(slug: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  return tenant?.id ?? null;
}

/**
 * Gets all active tenants (for registration dropdown, admin panel).
 */
export async function getActiveTenants() {
  return prisma.tenant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
    },
    orderBy: { name: "asc" },
  });
}
