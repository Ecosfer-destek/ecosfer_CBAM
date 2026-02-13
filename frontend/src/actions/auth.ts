"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema, createUserSchema, changePasswordSchema } from "@/lib/validations/auth";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logError } from "@/lib/logger";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantId: string;
}) {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, password, tenantId } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Bu e-posta adresi zaten kayitli" };
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) {
      return { error: "Gecersiz sirket secimi" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "OPERATOR" as UserRole,
        tenantId,
      },
    });

    return { success: true };
  } catch (e) {
    logError("auth.registerUser", e);
    return { error: "Kayit sirasinda bir hata olustu" };
  }
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const session = await requireRole("COMPANY_ADMIN" as UserRole);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (session.user as any).tenantId as string;

  try {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Bu e-posta adresi zaten kayitli" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as UserRole,
        tenantId,
      },
    });

    return { success: true, userId: user.id };
  } catch (e) {
    logError("auth.createUser", e);
    return { error: "Kullanici olusturulurken bir hata olustu" };
  }
}

export async function updateUser(
  userId: string,
  input: { name?: string; email?: string; role?: string; isActive?: boolean }
) {
  const session = await requireRole("COMPANY_ADMIN" as UserRole);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (session.user as any).tenantId as string;

  try {
    // Verify user belongs to this tenant
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!userToUpdate || userToUpdate.tenantId !== tenantId) {
      return { error: "Yetkisiz islem" };
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.role !== undefined) data.role = input.role as UserRole;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return { success: true };
  } catch (e) {
    logError("auth.updateUser", e);
    return { error: "Kullanici guncellenirken bir hata olustu" };
  }
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  const session = await requireAuth();

  try {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { error: "Kullanici bulunamadi" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Mevcut sifre hatali" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (e) {
    logError("auth.changePassword", e);
    return { error: "Sifre degistirilirken bir hata olustu" };
  }
}

export async function getUsers() {
  const session = await requireRole("COMPANY_ADMIN" as UserRole);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (session.user as any).tenantId as string;

  return prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteUser(userId: string) {
  const session = await requireRole("COMPANY_ADMIN" as UserRole);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (session.user as any).tenantId as string;

  // Prevent self-deletion
  if (userId === session.user.id) {
    return { error: "Kendi hesabinizi silemezsiniz" };
  }

  try {
    // Verify user belongs to this tenant
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!userToDelete || userToDelete.tenantId !== tenantId) {
      return { error: "Yetkisiz islem" };
    }

    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (e) {
    logError("auth.deleteUser", e);
    return { error: "Kullanici silinirken bir hata olustu" };
  }
}
