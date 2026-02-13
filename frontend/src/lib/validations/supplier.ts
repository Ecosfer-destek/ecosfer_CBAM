import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Tedarikçi adı gereklidir"),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const supplierSurveySchema = z.object({
  supplierId: z.string().min(1, "Tedarikçi seçimi gereklidir"),
  supplierGoodId: z.string().optional().nullable(),
  supplierUnitId: z.string().optional().nullable(),
  supplierCalId: z.string().optional().nullable(),
  value1: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  value2: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
});

export type SupplierSurveyInput = z.infer<typeof supplierSurveySchema>;

export const supplierInviteSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  name: z.string().min(1, "Tedarikçi adı gereklidir"),
  companyId: z.string().optional().nullable(),
});

export type SupplierInviteInput = z.infer<typeof supplierInviteSchema>;
