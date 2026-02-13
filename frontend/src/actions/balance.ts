"use server";

import { getTenantDb } from "@/lib/auth/session";
import { logError } from "@/lib/logger";

// ============================================================================
// FuelBalance Actions
// ============================================================================

export interface FuelBalanceInput {
  name: string | null;
  totalFuelInput: number | string | null;
  directFuelForCbamGoods: number | string | null;
  fuelForElectricity: number | string | null;
  directFuelForNonCbamGoods: number | string | null;
  rest: number | string | null;
  unitId: string | null;
  installationDataId: string;
}

export async function getFuelBalances(installationDataId?: string) {
  const { db } = await getTenantDb();
  return db.fuelBalance.findMany({
    where: installationDataId ? { installationDataId } : undefined,
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFuelBalance(id: string) {
  const { db } = await getTenantDb();
  return db.fuelBalance.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
  });
}

export async function createFuelBalance(input: FuelBalanceInput) {
  const { db } = await getTenantDb();

  try {
    const fuelBalance = await db.fuelBalance.create({
      data: input,
    });
    return { success: true, id: fuelBalance.id };
  } catch (e) {
    logError("balance.createFuelBalance", e);
    return { error: "Yakit dengesi olusturulurken bir hata olustu" };
  }
}

export async function updateFuelBalance(id: string, input: FuelBalanceInput) {
  const { db } = await getTenantDb();

  try {
    await db.fuelBalance.update({
      where: { id },
      data: input,
    });
    return { success: true };
  } catch (e) {
    logError("balance.updateFuelBalance", e);
    return { error: "Yakit dengesi guncellenirken bir hata olustu" };
  }
}

export async function deleteFuelBalance(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.fuelBalance.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("balance.deleteFuelBalance", e);
    return { error: "Yakit dengesi silinirken bir hata olustu" };
  }
}

// ============================================================================
// GhgBalanceByType Actions
// ============================================================================

export interface GhgBalanceByTypeInput {
  name: string | null;
  totalCo2Emissions: number | string | null;
  biomassEmissions: number | string | null;
  totalN2oEmissions: number | string | null;
  totalPfcEmissions: number | string | null;
  totalDirectEmissions: number | string | null;
  totalIndirectEmissions: number | string | null;
  totalEmissions: number | string | null;
  unitId: string | null;
  installationDataId: string;
}

export async function getGhgBalanceByTypes(installationDataId?: string) {
  const { db } = await getTenantDb();
  return db.ghgBalanceByType.findMany({
    where: installationDataId ? { installationDataId } : undefined,
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGhgBalanceByType(id: string) {
  const { db } = await getTenantDb();
  return db.ghgBalanceByType.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
  });
}

export async function createGhgBalanceByType(input: GhgBalanceByTypeInput) {
  const { db } = await getTenantDb();

  try {
    const ghgBalanceByType = await db.ghgBalanceByType.create({
      data: input,
    });
    return { success: true, id: ghgBalanceByType.id };
  } catch (e) {
    logError("balance.createGhgBalanceByType", e);
    return { error: "Sera gazi dengesi (ture gore) olusturulurken bir hata olustu" };
  }
}

export async function updateGhgBalanceByType(
  id: string,
  input: GhgBalanceByTypeInput
) {
  const { db } = await getTenantDb();

  try {
    await db.ghgBalanceByType.update({
      where: { id },
      data: input,
    });
    return { success: true };
  } catch (e) {
    logError("balance.updateGhgBalanceByType", e);
    return { error: "Sera gazi dengesi (ture gore) guncellenirken bir hata olustu" };
  }
}

export async function deleteGhgBalanceByType(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.ghgBalanceByType.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("balance.deleteGhgBalanceByType", e);
    return { error: "Sera gazi dengesi (ture gore) silinirken bir hata olustu" };
  }
}

// ============================================================================
// GhgBalanceByMonitoringMethodologyType Actions
// ============================================================================

export interface GhgBalanceByMonitoringMethodologyTypeInput {
  name: string | null;
  calculationBasedExclPfcEmissions: number | string | null;
  totalPfcEmissions: number | string | null;
  measurementBased: number | string | null;
  other: number | string | null;
  unitId: string | null;
  installationDataId: string;
}

export async function getGhgBalanceByMonitoringMethodologyTypes(
  installationDataId?: string
) {
  const { db } = await getTenantDb();
  return db.ghgBalanceByMonitoringMethodologyType.findMany({
    where: installationDataId ? { installationDataId } : undefined,
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGhgBalanceByMonitoringMethodologyType(id: string) {
  const { db } = await getTenantDb();
  return db.ghgBalanceByMonitoringMethodologyType.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      installationData: {
        select: {
          id: true,
          installation: { select: { name: true } },
        },
      },
    },
  });
}

export async function createGhgBalanceByMonitoringMethodologyType(
  input: GhgBalanceByMonitoringMethodologyTypeInput
) {
  const { db } = await getTenantDb();

  try {
    const ghgBalanceByMonitoringMethodologyType =
      await db.ghgBalanceByMonitoringMethodologyType.create({
        data: input,
      });
    return { success: true, id: ghgBalanceByMonitoringMethodologyType.id };
  } catch (e) {
    logError("balance.createGhgBalanceByMonitoringMethodologyType", e);
    return {
      error:
        "Sera gazi dengesi (izleme metodolojisine gore) olusturulurken bir hata olustu",
    };
  }
}

export async function updateGhgBalanceByMonitoringMethodologyType(
  id: string,
  input: GhgBalanceByMonitoringMethodologyTypeInput
) {
  const { db } = await getTenantDb();

  try {
    await db.ghgBalanceByMonitoringMethodologyType.update({
      where: { id },
      data: input,
    });
    return { success: true };
  } catch (e) {
    logError("balance.updateGhgBalanceByMonitoringMethodologyType", e);
    return {
      error:
        "Sera gazi dengesi (izleme metodolojisine gore) guncellenirken bir hata olustu",
    };
  }
}

export async function deleteGhgBalanceByMonitoringMethodologyType(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.ghgBalanceByMonitoringMethodologyType.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("balance.deleteGhgBalanceByMonitoringMethodologyType", e);
    return {
      error:
        "Sera gazi dengesi (izleme metodolojisine gore) silinirken bir hata olustu",
    };
  }
}
