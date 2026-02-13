"use server";

import { getTenantDb } from "@/lib/auth/session";
import type { ReportPart, ReportSectionLevel, ReportSectionContentType } from "@prisma/client";
import { logError } from "@/lib/logger";

// ============================================================================
// CbamReport Actions (no tenantId, belongs to InstallationData)
// ============================================================================

export async function createCbamReport(input: {
  reportPeriod: string;
  reportTemplate?: string | null;
  downloadUrl?: string | null;
  excelFileUrl?: string | null;
  installationDataId: string;
}) {
  const { db } = await getTenantDb();

  try {
    const report = await db.cbamReport.create({
      data: input,
    });
    return { success: true, id: report.id };
  } catch (e) {
    logError("report.createCbamReport", e);
    return { error: "CBAM raporu olusturulurken bir hata olustu" };
  }
}

export async function getCbamReportsByInstallationData(installationDataId: string) {
  const { db } = await getTenantDb();

  try {
    return await db.cbamReport.findMany({
      where: { installationDataId },
      orderBy: { reportPeriod: "desc" },
    });
  } catch (e) {
    logError("report.getCbamReports", e);
    return [];
  }
}

export async function deleteCbamReport(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.cbamReport.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("report.deleteCbamReport", e);
    return { error: "CBAM raporu silinirken bir hata olustu" };
  }
}

// ============================================================================
// Report Actions (has tenantId)
// ============================================================================

export async function getReports() {
  const { db } = await getTenantDb();

  try {
    return await db.report.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    logError("report.getReports", e);
    return [];
  }
}

export async function getReport(id: string) {
  const { db } = await getTenantDb();

  try {
    return await db.report.findUnique({
      where: { id },
      include: {
        reportSections: {
          include: {
            reportSectionContents: {
              orderBy: { orderNo: "asc" },
            },
          },
          orderBy: { orderNo: "asc" },
        },
      },
    });
  } catch (e) {
    logError("report.getReport", e);
    return null;
  }
}

export async function createReport(input: {
  coverTitle: string;
  coverContent?: string | null;
  coverImageUrl?: string | null;
}) {
  const { db, tenantId } = await getTenantDb();

  try {
    const report = await db.report.create({
      data: { ...input, tenantId },
    });
    return { success: true, id: report.id };
  } catch (e) {
    logError("report.createReport", e);
    return { error: "Rapor olusturulurken bir hata olustu" };
  }
}

export async function updateReport(
  id: string,
  input: {
    coverTitle?: string;
    coverContent?: string | null;
    coverImageUrl?: string | null;
  }
) {
  const { db } = await getTenantDb();

  try {
    await db.report.update({
      where: { id },
      data: input,
    });
    return { success: true };
  } catch (e) {
    logError("report.updateReport", e);
    return { error: "Rapor guncellenirken bir hata olustu" };
  }
}

export async function deleteReport(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.report.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("report.deleteReport", e);
    return { error: "Rapor silinirken bir hata olustu" };
  }
}

// ============================================================================
// ReportSection Actions (no tenantId, belongs to Report or InstallationData)
// ============================================================================

export async function createReportSection(input: {
  part: ReportPart;
  sectionCode?: string | null;
  sectionTitle: string;
  sectionLevel: ReportSectionLevel;
  orderNo: number;
  isEditable?: boolean;
  installationDataId?: string | null;
  reportId?: string | null;
}) {
  const { db } = await getTenantDb();

  try {
    const { installationDataId, reportId, ...rest } = input;
    const section = await db.reportSection.create({
      data: {
        ...rest,
        ...(installationDataId ? { installationData: { connect: { id: installationDataId } } } : {}),
        ...(reportId ? { report: { connect: { id: reportId } } } : {}),
      },
    });
    return { success: true, id: section.id };
  } catch (e) {
    logError("report.createReportSection", e);
    return { error: "Rapor bolumu olusturulurken bir hata olustu" };
  }
}

export async function updateReportSection(
  id: string,
  input: {
    part?: ReportPart;
    sectionCode?: string | null;
    sectionTitle?: string;
    sectionLevel?: ReportSectionLevel;
    orderNo?: number;
    isEditable?: boolean;
    installationDataId?: string | null;
    reportId?: string | null;
  }
) {
  const { db } = await getTenantDb();

  try {
    const { installationDataId, reportId, ...rest } = input;
    await db.reportSection.update({
      where: { id },
      data: {
        ...rest,
        ...(installationDataId !== undefined ? {
          installationData: installationDataId ? { connect: { id: installationDataId } } : { disconnect: true },
        } : {}),
        ...(reportId !== undefined ? {
          report: reportId ? { connect: { id: reportId } } : { disconnect: true },
        } : {}),
      },
    });
    return { success: true };
  } catch (e) {
    logError("report.updateReportSection", e);
    return { error: "Rapor bolumu guncellenirken bir hata olustu" };
  }
}

export async function deleteReportSection(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.reportSection.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("report.deleteReportSection", e);
    return { error: "Rapor bolumu silinirken bir hata olustu" };
  }
}

// ============================================================================
// ReportSectionContent Actions (no tenantId, belongs to ReportSection)
// ============================================================================

export async function createReportSectionContent(input: {
  contentType: ReportSectionContentType;
  orderNo: number;
  textContent?: string | null;
  imageUrl?: string | null;
  reportSectionId: string;
}) {
  const { db } = await getTenantDb();

  try {
    const { reportSectionId, ...rest } = input;
    const content = await db.reportSectionContent.create({
      data: {
        ...rest,
        reportSection: { connect: { id: reportSectionId } },
      },
    });
    return { success: true, id: content.id };
  } catch (e) {
    logError("report.createReportSectionContent", e);
    return { error: "Rapor bolum icerigi olusturulurken bir hata olustu" };
  }
}

export async function updateReportSectionContent(
  id: string,
  input: {
    contentType?: ReportSectionContentType;
    orderNo?: number;
    textContent?: string | null;
    imageUrl?: string | null;
    reportSectionId?: string;
  }
) {
  const { db } = await getTenantDb();

  try {
    const { reportSectionId, ...rest } = input;
    await db.reportSectionContent.update({
      where: { id },
      data: {
        ...rest,
        ...(reportSectionId ? { reportSection: { connect: { id: reportSectionId } } } : {}),
      },
    });
    return { success: true };
  } catch (e) {
    logError("report.updateReportSectionContent", e);
    return { error: "Rapor bolum icerigi guncellenirken bir hata olustu" };
  }
}

export async function deleteReportSectionContent(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.reportSectionContent.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("report.deleteReportSectionContent", e);
    return { error: "Rapor bolum icerigi silinirken bir hata olustu" };
  }
}

// ============================================================================
// ReportTemplate Actions (has tenantId)
// ============================================================================

export async function getReportTemplates() {
  const { db } = await getTenantDb();

  try {
    return await db.reportTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    logError("report.getReportTemplates", e);
    return [];
  }
}

export async function createReportTemplate(input: {
  name: string;
  description?: string | null;
  content?: string | null;
  isActive?: boolean;
}) {
  const { db, tenantId } = await getTenantDb();

  try {
    const template = await db.reportTemplate.create({
      data: { ...input, tenantId },
    });
    return { success: true, id: template.id };
  } catch (e) {
    logError("report.createReportTemplate", e);
    return { error: "Rapor sablonu olusturulurken bir hata olustu" };
  }
}

export async function updateReportTemplate(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    content?: string | null;
    isActive?: boolean;
  }
) {
  const { db } = await getTenantDb();

  try {
    await db.reportTemplate.update({
      where: { id },
      data: input,
    });
    return { success: true };
  } catch (e) {
    logError("report.updateReportTemplate", e);
    return { error: "Rapor sablonu guncellenirken bir hata olustu" };
  }
}

export async function deleteReportTemplate(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.reportTemplate.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("report.deleteReportTemplate", e);
    return { error: "Rapor sablonu silinirken bir hata olustu" };
  }
}
