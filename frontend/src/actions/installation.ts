"use server";

import { getTenantDb } from "@/lib/auth/session";
import {
  installationSchema,
  type InstallationInput,
} from "@/lib/validations/company";
import { logError } from "@/lib/logger";

export async function getInstallations() {
  const { db } = await getTenantDb();
  return db.installation.findMany({
    include: {
      company: { select: { id: true, name: true } },
      country: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getInstallation(id: string) {
  const { db } = await getTenantDb();
  return db.installation.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      country: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
      installationDatas: {
        orderBy: { startDate: "desc" },
        take: 10,
      },
    },
  });
}

export async function createInstallation(input: InstallationInput) {
  const { db, tenantId } = await getTenantDb();

  const parsed = installationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const installation = await db.installation.create({
      data: { ...parsed.data, tenantId },
    });
    return { success: true, id: installation.id };
  } catch (e) {
    logError("installation.createInstallation", e);
    return { error: "Tesis olusturulurken bir hata olustu" };
  }
}

export async function updateInstallation(
  id: string,
  input: InstallationInput
) {
  const { db } = await getTenantDb();

  const parsed = installationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.installation.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true };
  } catch (e) {
    logError("installation.updateInstallation", e);
    return { error: "Tesis guncellenirken bir hata olustu" };
  }
}

export async function deleteInstallation(id: string) {
  const { db } = await getTenantDb();

  try {
    await db.installation.delete({ where: { id } });
    return { success: true };
  } catch (e) {
    logError("installation.deleteInstallation", e);
    return { error: "Tesis silinirken bir hata olustu" };
  }
}
