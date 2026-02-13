"use server";

import { getTenantDb } from "@/lib/auth/session";
import { logError } from "@/lib/logger";

// ===================== AnnualDeclaration =====================

export async function getDeclarations() {
  const { db } = await getTenantDb();
  return db.annualDeclaration.findMany({
    include: {
      certificateSurrenders: true,
      freeAllocationAdjustments: true,
    },
    orderBy: { year: "desc" },
  });
}

export async function getDeclaration(id: string) {
  const { db } = await getTenantDb();
  return db.annualDeclaration.findUnique({
    where: { id },
    include: {
      certificateSurrenders: {
        include: { certificate: true },
        orderBy: { surrenderDate: "desc" },
      },
      freeAllocationAdjustments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createDeclaration(input: {
  year: number;
  notes?: string | null;
}) {
  const { db, tenantId } = await getTenantDb();
  try {
    const decl = await db.annualDeclaration.create({
      data: { year: input.year, notes: input.notes, tenantId },
    });
    return { success: true, id: decl.id };
  } catch (e) {
    logError("declaration.createDeclaration", e);
    return { error: "Beyanname olusturulurken bir hata olustu" };
  }
}

export async function updateDeclaration(
  id: string,
  input: { status?: string; notes?: string | null; submissionDate?: string | null }
) {
  const { db } = await getTenantDb();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.submissionDate !== undefined)
      data.submissionDate = input.submissionDate ? new Date(input.submissionDate) : null;
    await db.annualDeclaration.update({ where: { id }, data });
    return { success: true };
  } catch (e) {
    logError("declaration.updateDeclaration", e);
    return { error: "Beyanname guncellenirken bir hata olustu" };
  }
}

export async function deleteDeclaration(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.annualDeclaration.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteDeclaration", e);
    return { error: "Beyanname silinirken bir hata olustu" };
  }
}

// ===================== CbamCertificate =====================

export async function getCertificates() {
  const { db } = await getTenantDb();
  return db.cbamCertificate.findMany({
    include: { surrenders: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function createCertificate(input: {
  certificateNo: string;
  issueDate: string;
  expiryDate?: string | null;
  pricePerTonne?: number | null;
  quantity?: number;
}) {
  const { db, tenantId } = await getTenantDb();
  try {
    const cert = await db.cbamCertificate.create({
      data: {
        certificateNo: input.certificateNo,
        issueDate: new Date(input.issueDate),
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        pricePerTonne: input.pricePerTonne,
        quantity: input.quantity || 1,
        tenantId,
      },
    });
    return { success: true, id: cert.id };
  } catch (e) {
    logError("declaration.createCertificate", e);
    return { error: "Sertifika olusturulurken bir hata olustu" };
  }
}

export async function deleteCertificate(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.cbamCertificate.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteCertificate", e);
    return { error: "Sertifika silinirken bir hata olustu" };
  }
}

// ===================== MonitoringPlan =====================

export async function getMonitoringPlans() {
  const { db } = await getTenantDb();
  return db.monitoringPlan.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createMonitoringPlan(input: {
  name: string;
  version?: string | null;
  description?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}) {
  const { db, tenantId } = await getTenantDb();
  try {
    const plan = await db.monitoringPlan.create({
      data: {
        name: input.name,
        version: input.version,
        description: input.description,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validTo: input.validTo ? new Date(input.validTo) : null,
        tenantId,
      },
    });
    return { success: true, id: plan.id };
  } catch (e) {
    logError("declaration.createMonitoringPlan", e);
    return { error: "Izleme plani olusturulurken bir hata olustu" };
  }
}

export async function updateMonitoringPlan(
  id: string,
  input: {
    name?: string;
    version?: string | null;
    status?: string;
    description?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
  }
) {
  const { db } = await getTenantDb();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...input };
    if (input.validFrom !== undefined)
      data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
    if (input.validTo !== undefined)
      data.validTo = input.validTo ? new Date(input.validTo) : null;
    await db.monitoringPlan.update({ where: { id }, data });
    return { success: true };
  } catch (e) {
    logError("declaration.updateMonitoringPlan", e);
    return { error: "Izleme plani guncellenirken bir hata olustu" };
  }
}

export async function deleteMonitoringPlan(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.monitoringPlan.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteMonitoringPlan", e);
    return { error: "Izleme plani silinirken bir hata olustu" };
  }
}

// ===================== AuthorisationApplication =====================

export async function getAuthorisations() {
  const { db } = await getTenantDb();
  return db.authorisationApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createAuthorisation(input: {
  applicantName: string;
  applicantType?: string | null;
  notes?: string | null;
}) {
  const { db, tenantId } = await getTenantDb();
  try {
    const app = await db.authorisationApplication.create({
      data: { ...input, tenantId },
    });
    return { success: true, id: app.id };
  } catch (e) {
    logError("declaration.createAuthorisation", e);
    return { error: "Yetkilendirme basvurusu olusturulurken bir hata olustu" };
  }
}

export async function updateAuthorisation(
  id: string,
  input: { status?: string; approvalDate?: string | null; notes?: string | null }
) {
  const { db } = await getTenantDb();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...input };
    if (input.approvalDate !== undefined)
      data.approvalDate = input.approvalDate ? new Date(input.approvalDate) : null;
    await db.authorisationApplication.update({ where: { id }, data });
    return { success: true };
  } catch (e) {
    logError("declaration.updateAuthorisation", e);
    return { error: "Yetkilendirme basvurusu guncellenirken bir hata olustu" };
  }
}

export async function deleteAuthorisation(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.authorisationApplication.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteAuthorisation", e);
    return { error: "Yetkilendirme basvurusu silinirken bir hata olustu" };
  }
}

// ===================== CertificateSurrender =====================

export async function createCertificateSurrender(input: {
  certificateId: string;
  declarationId: string;
  quantity: number;
  surrenderDate: string;
}) {
  const { db } = await getTenantDb();
  try {
    const surrender = await db.certificateSurrender.create({
      data: {
        quantity: input.quantity,
        surrenderDate: new Date(input.surrenderDate),
        certificate: { connect: { id: input.certificateId } },
        declaration: { connect: { id: input.declarationId } },
      },
    });
    return { success: true, id: surrender.id };
  } catch (e) {
    logError("declaration.createCertificateSurrender", e);
    return { error: "Sertifika teslimi olusturulurken bir hata olustu" };
  }
}

export async function deleteCertificateSurrender(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.certificateSurrender.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteCertificateSurrender", e);
    return { error: "Sertifika teslimi silinirken bir hata olustu" };
  }
}

// ===================== FreeAllocationAdjustment =====================

export async function createFreeAllocationAdjustment(input: {
  declarationId: string;
  adjustmentType: string;
  amount: number;
  description?: string | null;
}) {
  const { db } = await getTenantDb();
  try {
    const adj = await db.freeAllocationAdjustment.create({
      data: {
        adjustmentType: input.adjustmentType,
        amount: input.amount,
        description: input.description,
        declaration: { connect: { id: input.declarationId } },
      },
    });
    return { success: true, id: adj.id };
  } catch (e) {
    logError("declaration.createFreeAllocationAdjustment", e);
    return { error: "Ucretsiz tahsis duzeltmesi olusturulurken bir hata olustu" };
  }
}

export async function deleteFreeAllocationAdjustment(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.freeAllocationAdjustment.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("declaration.deleteFreeAllocationAdjustment", e);
    return { error: "Ucretsiz tahsis duzeltmesi silinirken bir hata olustu" };
  }
}
