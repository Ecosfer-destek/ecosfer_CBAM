import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi gereklidir")
    .email("Gecerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(1, "Sifre gereklidir")
    .min(6, "Sifre en az 6 karakter olmalidir"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Ad soyad gereklidir")
      .min(2, "Ad soyad en az 2 karakter olmalidir"),
    email: z
      .string()
      .min(1, "E-posta adresi gereklidir")
      .email("Gecerli bir e-posta adresi giriniz"),
    password: z
      .string()
      .min(1, "Sifre gereklidir")
      .min(8, "Sifre en az 8 karakter olmalidir")
      .regex(/[A-Z]/, "Sifre en az bir buyuk harf icermelidir")
      .regex(/[0-9]/, "Sifre en az bir rakam icermelidir"),
    confirmPassword: z.string().min(1, "Sifre tekrari gereklidir"),
    tenantId: z.string().min(1, "Sirket secimi gereklidir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Sifreler eslesmiyor",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut sifre gereklidir"),
    newPassword: z
      .string()
      .min(8, "Yeni sifre en az 8 karakter olmalidir")
      .regex(/[A-Z]/, "Sifre en az bir buyuk harf icermelidir")
      .regex(/[0-9]/, "Sifre en az bir rakam icermelidir"),
    confirmNewPassword: z.string().min(1, "Sifre tekrari gereklidir"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Sifreler eslesmiyor",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalidir"),
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(8, "Sifre en az 8 karakter olmalidir")
    .regex(/[A-Z]/, "Sifre en az bir buyuk harf icermelidir")
    .regex(/[0-9]/, "Sifre en az bir rakam icermelidir"),
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
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalidir").optional(),
  email: z.string().email("Gecerli bir e-posta adresi giriniz").optional(),
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
