"use server";

import { getTenantDb } from "@/lib/auth/session";
import { randomBytes } from "crypto";
import { logError } from "@/lib/logger";

// ============================================================================
// Supplier CRUD
// ============================================================================

export async function getSuppliers() {
  const { db } = await getTenantDb();
  return db.supplier.findMany({
    include: {
      country: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { supplierSurveys: true, supplierGoods: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  const { db } = await getTenantDb();
  return db.supplier.findUnique({
    where: { id },
    include: {
      country: true,
      company: true,
      user: { select: { id: true, name: true, email: true } },
      supplierSurveys: {
        include: {
          supplierGood: true,
          supplierUnit: true,
          supplierCal: true,
        },
        orderBy: { createdAt: "desc" },
      },
      supplierGoods: {
        include: { goodsCategory: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function createSupplier(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
  contactPerson?: string | null;
  countryId?: string | null;
  companyId?: string | null;
}) {
  const { db, tenantId } = await getTenantDb();
  try {
    const supplier = await db.supplier.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        taxNumber: input.taxNumber,
        taxOffice: input.taxOffice,
        contactPerson: input.contactPerson,
        tenantId,
        ...(input.countryId ? { country: { connect: { id: input.countryId } } } : {}),
        ...(input.companyId ? { company: { connect: { id: input.companyId } } } : {}),
      },
    });
    return { success: true, id: supplier.id };
  } catch (e) {
    logError("supplier.createSupplier", e);
    return { error: "Tedarikci olusturulurken bir hata olustu" };
  }
}

export async function updateSupplier(
  id: string,
  input: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    taxNumber?: string | null;
    taxOffice?: string | null;
    contactPerson?: string | null;
    countryId?: string | null;
    companyId?: string | null;
  }
) {
  const { db } = await getTenantDb();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.address !== undefined) data.address = input.address;
    if (input.taxNumber !== undefined) data.taxNumber = input.taxNumber;
    if (input.taxOffice !== undefined) data.taxOffice = input.taxOffice;
    if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson;
    if (input.countryId !== undefined) {
      data.country = input.countryId ? { connect: { id: input.countryId } } : { disconnect: true };
    }

    await db.supplier.update({ where: { id }, data });
    return { success: true };
  } catch (e) {
    logError("supplier.updateSupplier", e);
    return { error: "Tedarikci guncellenirken bir hata olustu" };
  }
}

export async function deleteSupplier(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.supplier.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("supplier.deleteSupplier", e);
    return { error: "Tedarikci silinirken bir hata olustu" };
  }
}

// ============================================================================
// Invitation System
// ============================================================================

export async function inviteSupplier(supplierId: string) {
  const { db } = await getTenantDb();
  try {
    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return { error: "Tedarikci bulunamadi" };
    if (!supplier.email) return { error: "Tedarikci e-posta adresi gerekli" };

    const token = randomBytes(32).toString("hex");

    await db.supplier.update({
      where: { id: supplierId },
      data: {
        invitationStatus: "INVITED",
        invitedAt: new Date(),
        invitationToken: token,
      },
    });

    // Send invitation email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/supplier/register?token=${token}`;

    try {
      const { sendInvitationEmail } = await import("@/lib/email");
      await sendInvitationEmail(supplier.email, supplier.name, inviteUrl);
    } catch {
      // Email sending failed but invitation was created
      // The supplier can still be re-invited
    }

    return { success: true };
  } catch (e) {
    logError("supplier.inviteSupplier", e);
    return { error: "Davet gonderilirken bir hata olustu" };
  }
}

export async function getSupplierByToken(token: string) {
  const { db } = await getTenantDb();
  return db.supplier.findUnique({
    where: { invitationToken: token },
    include: { company: true, country: true },
  });
}

// ============================================================================
// Supplier Survey CRUD
// ============================================================================

export async function getSupplierSurveys(supplierId?: string) {
  const { db } = await getTenantDb();
  return db.supplierSurvey.findMany({
    where: supplierId ? { supplierId } : {},
    include: {
      supplier: { select: { id: true, name: true } },
      supplierGood: true,
      supplierUnit: true,
      supplierCal: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSupplierSurvey(input: {
  supplierId: string;
  supplierGoodId?: string | null;
  reportingPeriodStart?: string | null;
  reportingPeriodEnd?: string | null;
  specificEmbeddedEmissions?: number | null;
  directEmissions?: number | null;
  indirectEmissions?: number | null;
  productionVolume?: number | null;
  electricityConsumption?: number | null;
  heatConsumption?: number | null;
  emissionFactorSource?: string | null;
  monitoringMethodology?: string | null;
  notes?: string | null;
}) {
  const { db } = await getTenantDb();
  try {
    const survey = await db.supplierSurvey.create({
      data: {
        supplier: { connect: { id: input.supplierId } },
        ...(input.supplierGoodId
          ? { supplierGood: { connect: { id: input.supplierGoodId } } }
          : {}),
        reportingPeriodStart: input.reportingPeriodStart
          ? new Date(input.reportingPeriodStart)
          : null,
        reportingPeriodEnd: input.reportingPeriodEnd
          ? new Date(input.reportingPeriodEnd)
          : null,
        specificEmbeddedEmissions: input.specificEmbeddedEmissions,
        directEmissions: input.directEmissions,
        indirectEmissions: input.indirectEmissions,
        productionVolume: input.productionVolume,
        electricityConsumption: input.electricityConsumption,
        heatConsumption: input.heatConsumption,
        emissionFactorSource: input.emissionFactorSource,
        monitoringMethodology: input.monitoringMethodology,
        notes: input.notes,
      },
    });
    return { success: true, id: survey.id };
  } catch (e) {
    logError("supplier.createSurvey", e);
    return { error: "Anket olusturulurken bir hata olustu" };
  }
}

export async function submitSupplierSurvey(surveyId: string) {
  const { db } = await getTenantDb();
  try {
    await db.supplierSurvey.update({
      where: { id: surveyId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    return { success: true };
  } catch (e) {
    logError("supplier.submitSurvey", e);
    return { error: "Anket gonderilirken bir hata olustu" };
  }
}

export async function deleteSupplierSurvey(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.supplierSurvey.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("supplier.deleteSurvey", e);
    return { error: "Anket silinirken bir hata olustu" };
  }
}

// ============================================================================
// Supplier Good CRUD
// ============================================================================

export async function getSupplierGoods(supplierId?: string) {
  const { db } = await getTenantDb();
  return db.supplierGood.findMany({
    where: supplierId ? { supplierId } : {},
    include: {
      goodsCategory: true,
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createSupplierGood(input: {
  name: string;
  code?: string | null;
  description?: string | null;
  cnCode?: string | null;
  supplierId?: string | null;
  goodsCategoryId?: string | null;
}) {
  const { db } = await getTenantDb();
  try {
    const good = await db.supplierGood.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        cnCode: input.cnCode,
        ...(input.supplierId ? { supplier: { connect: { id: input.supplierId } } } : {}),
        ...(input.goodsCategoryId
          ? { goodsCategory: { connect: { id: input.goodsCategoryId } } }
          : {}),
      },
    });
    return { success: true, id: good.id };
  } catch (e) {
    logError("supplier.createSupplierGood", e);
    return { error: "Mal olusturulurken bir hata olustu" };
  }
}

export async function deleteSupplierGood(id: string) {
  const { db } = await getTenantDb();
  try {
    await db.supplierGood.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("supplier.deleteSupplierGood", e);
    return { error: "Mal silinirken bir hata olustu" };
  }
}

// ============================================================================
// Supplier Survey Admin
// ============================================================================

export async function getSupplierSurveysForAdmin() {
  const { db } = await getTenantDb();
  return db.supplierSurvey.findMany({
    include: {
      supplier: { select: { id: true, name: true, email: true } },
      supplierGood: { select: { id: true, name: true, cnCode: true } },
      supplierUnit: true,
      supplierCal: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveSupplierSurvey(surveyId: string) {
  const { db } = await getTenantDb();
  try {
    await db.supplierSurvey.update({
      where: { id: surveyId },
      data: { status: "APPROVED" },
    });
    return { success: true };
  } catch (e) {
    logError("supplier.approveSurvey", e);
    return { error: "Anket onaylanirken bir hata olustu" };
  }
}
