"use server";

import { getTenantDb } from "@/lib/auth/session";
import { companySchema, type CompanyInput } from "@/lib/validations/company";
import { logError } from "@/lib/logger";

export async function getCompanies() {
  const { db } = await getTenantDb();
  return db.company.findMany({
    include: {
      country: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCompany(id: string) {
  const { db } = await getTenantDb();
  return db.company.findUnique({
    where: { id },
    include: {
      country: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
      taxOffice: { select: { id: true, name: true } },
      installations: { orderBy: { name: "asc" } },
      companyProductionActivities: true,
    },
  });
}

export async function createCompany(input: CompanyInput) {
  const { db, tenantId } = await getTenantDb();

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const company = await db.company.create({
      data: { ...parsed.data, tenantId },
    });
    return { success: true, id: company.id };
  } catch (e) {
    logError("company.createCompany", e);
    return { error: "Sirket olusturulurken bir hata olustu" };
  }
}

export async function updateCompany(id: string, input: CompanyInput) {
  const { db } = await getTenantDb();

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.company.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true };
  } catch (e) {
    logError("company.updateCompany", e);
    return { error: "Sirket guncellenirken bir hata olustu" };
  }
}

export async function deleteCompany(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.company.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("company.deleteCompany", e);
    return { error: "Sirket silinirken bir hata olustu" };
  }
}
