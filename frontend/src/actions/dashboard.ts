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

export async function getDashboardChartData() {
  // Return sample chart data - in production this would query the database
  return {
    sparklines: {
      companies: [2, 3, 5, 4, 6, 8, 7, 9, 10, 12],
      installations: [1, 2, 3, 3, 4, 5, 6, 7, 8, 9],
      emissions: [45, 42, 38, 40, 35, 33, 30, 28, 25, 22],
      reports: [1, 1, 2, 3, 3, 4, 5, 5, 6, 7],
      declarations: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5],
    },
    trends: {
      companies: 15,
      installations: 12,
      emissions: -8,
      reports: 20,
      declarations: 10,
    },
    scopeDistribution: {
      scope1: 45,
      scope2: 30,
      scope3: 25,
    },
    monthlyEmissions: [
      { month: 1, value: 120 },
      { month: 2, value: 115 },
      { month: 3, value: 130 },
      { month: 4, value: 125 },
      { month: 5, value: 110 },
      { month: 6, value: 105 },
      { month: 7, value: 100 },
      { month: 8, value: 95 },
      { month: 9, value: 90 },
      { month: 10, value: 88 },
      { month: 11, value: 85 },
      { month: 12, value: 80 },
    ],
    complianceScore: 78,
    targetProgress: 65,
  };
}
