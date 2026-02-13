import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi gereklidir")
    .email("Geçerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(1, "Şifre gereklidir")
    .min(6, "Şifre en az 6 karakter olmalıdır"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Ad soyad gereklidir")
      .min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z
      .string()
      .min(1, "E-posta adresi gereklidir")
      .email("Geçerli bir e-posta adresi giriniz"),
    password: z
      .string()
      .min(1, "Şifre gereklidir")
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
    confirmPassword: z.string().min(1, "Şifre tekrarı gereklidir"),
    tenantId: z.string().min(1, "Şirket seçimi gereklidir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
    newPassword: z
      .string()
      .min(8, "Yeni şifre en az 8 karakter olmalıdır")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
    confirmNewPassword: z.string().min(1, "Şifre tekrarı gereklidir"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  role: z.enum([
    "SUPER_ADMIN",
    "COMPANY_ADMIN",
    "OPERATOR",
    "SUPPLIER",
    "CBAM_DECLARANT",
    "VERIFIER",
  ]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır").optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "OPERATOR",
      "SUPPLIER",
      "CBAM_DECLARANT",
      "VERIFIER",
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
