"use server";

import { getTenantDb } from "@/lib/auth/session";
import { emissionSchema, type EmissionInput } from "@/lib/validations/emission";
import { logError } from "@/lib/logger";

export async function getEmissions(installationDataId?: string) {
  const { db } = await getTenantDb();
  return db.emission.findMany({
    where: installationDataId ? { installationDataId } : undefined,
    include: {
      emissionType: { select: { id: true, name: true, code: true } },
      emissionMethod: { select: { id: true, name: true } },
      typeOfGhg: { select: { id: true, name: true } },
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

export async function getEmission(id: string) {
  const { db } = await getTenantDb();
  return db.emission.findUnique({
    where: { id },
    include: {
      emissionType: { select: { id: true, name: true, code: true } },
      emissionMethod: { select: { id: true, name: true } },
      emissionMethod2: { select: { id: true, name: true } },
      emissionMethod3: { select: { id: true, name: true } },
      typeOfGhg: { select: { id: true, name: true } },
      adUnit: { select: { id: true, name: true } },
      ncvUnit: { select: { id: true, name: true } },
      efUnit: { select: { id: true, name: true } },
      ccUnit: { select: { id: true, name: true } },
      oxfUnit: { select: { id: true, name: true } },
      convfUnit: { select: { id: true, name: true } },
      biocUnit: { select: { id: true, name: true } },
    },
  });
}

export async function createEmission(input: EmissionInput) {
  const { db } = await getTenantDb();

  const parsed = emissionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const emission = await db.emission.create({
      data: parsed.data,
    });
    return { success: true, id: emission.id };
  } catch (e) {
    logError("emission.createEmission", e);
    return { error: "Emisyon olusturulurken bir hata olustu" };
  }
}

export async function updateEmission(id: string, input: EmissionInput) {
  const { db } = await getTenantDb();

  const parsed = emissionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.emission.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true };
  } catch (e) {
    logError("emission.updateEmission", e);
    return { error: "Emisyon guncellenirken bir hata olustu" };
  }
}

export async function deleteEmission(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.emission.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("emission.deleteEmission", e);
    return { error: "Emisyon silinirken bir hata olustu" };
  }
}
