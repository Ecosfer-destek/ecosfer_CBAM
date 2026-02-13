"use server";

import { getTenantDb } from "@/lib/auth/session";

export async function getDashboardStats() {
  const { db } = await getTenantDb();

  const [companies, installations, emissions, reports, declarations] =
    await Promise.all([
      db.company.count(),
      db.installation.count(),
      db.emission.count(),
      db.report.count(),
      db.annualDeclaration.count(),
    ]);

  return { companies, installations, emissions, reports, declarations };
}

export async function getRecentActivity() {
  const { db } = await getTenantDb();

  const [recentDeclarations, recentReports] = await Promise.all([
    db.annualDeclaration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        year: true,
        status: true,
        createdAt: true,
      },
    }),
    db.report.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        coverTitle: true,
        createdAt: true,
      },
    }),
  ]);

  return { recentDeclarations, recentReports };
}
