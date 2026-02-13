import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Şirket adı gereklidir"),
  officialName: z.string().optional().nullable(),
  taxNumber: z
    .string()
    .max(11, "Vergi numarası en fazla 11 karakter olmalıdır")
    .optional()
    .nullable(),
  address: z.string().max(1024).optional().nullable(),
  postCode: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  unlocode: z.string().optional().nullable(),
  poBox: z.string().optional().nullable(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().nullable(),
  phone: z.string().optional().nullable(),
  economicActivity: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  taxOfficeId: z.string().optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;

export const installationSchema = z.object({
  name: z.string().min(1, "Tesis adı gereklidir").max(1024),
  companyId: z.string().min(1, "Şirket seçimi gereklidir"),
  address: z.string().max(1024).optional().nullable(),
  postCode: z.string().optional().nullable(),
  poBox: z.string().optional().nullable(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().nullable(),
  phone: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  unlocode: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
});

export type InstallationInput = z.infer<typeof installationSchema>;

export const personSchema = z.object({
  firstName: z.string().min(1, "Ad gereklidir"),
  lastName: z.string().min(1, "Soyad gereklidir"),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().nullable(),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
});

export type PersonInput = z.infer<typeof personSchema>;
