"use server";

import { getTenantDb } from "@/lib/auth/session";
import {
  installationDataSchema,
  type InstallationDataInput,
} from "@/lib/validations/emission";
import { logError } from "@/lib/logger";

export async function getInstallationDataList(installationId?: string) {
  const { db } = await getTenantDb();
  return db.installationData.findMany({
    where: installationId ? { installationId } : undefined,
    include: {
      installation: {
        select: { id: true, name: true, company: { select: { name: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getInstallationData(id: string) {
  const { db } = await getTenantDb();
  return db.installationData.findUnique({
    where: { id },
    include: {
      installation: {
        select: { id: true, name: true, company: { select: { name: true } } },
      },
      installationGoodsCategoryAndRoutes: {
        include: {
          goodsCategory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      emissions: {
        include: {
          emissionType: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      relevantProductionProcesses: {
        include: {
          goodsCategory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      purchasedPrecursors: {
        include: {
          goodsCategory: { select: { id: true, name: true } },
          country: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      fuelBalances: { orderBy: { createdAt: "asc" } },
      ghgBalanceByTypes: { orderBy: { createdAt: "asc" } },
      ghgBalanceByMonitoringMethodologyTypes: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createInstallationData(input: InstallationDataInput) {
  const { db, tenantId } = await getTenantDb();

  const parsed = installationDataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const data = await db.installationData.create({
      data: { ...parsed.data, tenantId },
    });
    return { success: true, id: data.id };
  } catch (e) {
    logError("installationData.create", e);
    return { error: "Tesis verisi olusturulurken bir hata olustu" };
  }
}

export async function updateInstallationData(
  id: string,
  input: InstallationDataInput
) {
  const { db } = await getTenantDb();

  const parsed = installationDataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.installationData.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true };
  } catch (e) {
    logError("installationData.update", e);
    return { error: "Tesis verisi guncellenirken bir hata olustu" };
  }
}

export async function deleteInstallationData(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.installationData.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("installationData.delete", e);
    return { error: "Tesis verisi silinirken bir hata olustu" };
  }
}
