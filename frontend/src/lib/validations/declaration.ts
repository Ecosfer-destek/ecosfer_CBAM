import { z } from "zod";

export const annualDeclarationSchema = z.object({
  year: z.number().min(2023).max(2030),
  notes: z.string().optional().nullable(),
});

export type AnnualDeclarationInput = z.infer<typeof annualDeclarationSchema>;

export const certificateSchema = z.object({
  certificateNo: z.string().min(1, "Sertifika numarasi gereklidir"),
  issueDate: z.string().min(1, "Verilis tarihi gereklidir"),
  expiryDate: z.string().optional().nullable(),
  pricePerTonne: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  quantity: z.number().min(1, "Miktar en az 1 olmalidir").default(1),
});

export type CertificateInput = z.infer<typeof certificateSchema>;

export const certificateSurrenderSchema = z.object({
  certificateId: z.string().min(1, "Sertifika secimi gereklidir"),
  declarationId: z.string().min(1, "Beyanname secimi gereklidir"),
  quantity: z.number().min(1, "Miktar en az 1 olmalidir"),
  surrenderDate: z.string().min(1, "Teslim tarihi gereklidir"),
  notes: z.string().optional().nullable(),
});

export type CertificateSurrenderInput = z.infer<typeof certificateSurrenderSchema>;

export const monitoringPlanSchema = z.object({
  name: z.string().min(1, "Plan adi gereklidir"),
  version: z.string().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type MonitoringPlanInput = z.infer<typeof monitoringPlanSchema>;

export const authorisationSchema = z.object({
  applicantName: z.string().min(1, "Basvuru sahibi adi gereklidir"),
  applicantType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AuthorisationInput = z.infer<typeof authorisationSchema>;
