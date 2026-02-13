import { describe, it, expect } from "vitest";
import {
  annualDeclarationSchema,
  certificateSchema,
  certificateSurrenderSchema,
  monitoringPlanSchema,
  authorisationSchema,
} from "@/lib/validations/declaration";

describe("annualDeclarationSchema", () => {
  it("accepts valid year", () => {
    const result = annualDeclarationSchema.safeParse({ year: 2025 });
    expect(result.success).toBe(true);
  });

  it("rejects year below 2023", () => {
    const result = annualDeclarationSchema.safeParse({ year: 2022 });
    expect(result.success).toBe(false);
  });

  it("rejects year above 2030", () => {
    const result = annualDeclarationSchema.safeParse({ year: 2031 });
    expect(result.success).toBe(false);
  });

  it("accepts nullable notes", () => {
    const result = annualDeclarationSchema.safeParse({
      year: 2025,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts boundary years", () => {
    expect(annualDeclarationSchema.safeParse({ year: 2023 }).success).toBe(true);
    expect(annualDeclarationSchema.safeParse({ year: 2030 }).success).toBe(true);
  });
});

describe("certificateSchema", () => {
  it("accepts valid certificate data", () => {
    const result = certificateSchema.safeParse({
      certificateNo: "CBAM-2025-001",
      issueDate: "2025-01-15",
      quantity: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty certificateNo", () => {
    const result = certificateSchema.safeParse({
      certificateNo: "",
      issueDate: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty issueDate", () => {
    const result = certificateSchema.safeParse({
      certificateNo: "C-1",
      issueDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("transforms string pricePerTonne to number", () => {
    const result = certificateSchema.safeParse({
      certificateNo: "C-1",
      issueDate: "2025-01-15",
      pricePerTonne: "85.50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricePerTonne).toBe(85.5);
    }
  });

  it("defaults quantity to 1", () => {
    const result = certificateSchema.safeParse({
      certificateNo: "C-1",
      issueDate: "2025-01-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });
});

describe("certificateSurrenderSchema", () => {
  it("accepts valid surrender data", () => {
    const result = certificateSurrenderSchema.safeParse({
      certificateId: "cert-1",
      declarationId: "decl-1",
      quantity: 5,
      surrenderDate: "2025-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects quantity less than 1", () => {
    const result = certificateSurrenderSchema.safeParse({
      certificateId: "cert-1",
      declarationId: "decl-1",
      quantity: 0,
      surrenderDate: "2025-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty certificateId", () => {
    const result = certificateSurrenderSchema.safeParse({
      certificateId: "",
      declarationId: "decl-1",
      quantity: 1,
      surrenderDate: "2025-06-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("monitoringPlanSchema", () => {
  it("accepts valid plan data", () => {
    const result = monitoringPlanSchema.safeParse({
      name: "Monitoring Plan 2025",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = monitoringPlanSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Plan adi gereklidir");
    }
  });

  it("accepts all optional fields as null", () => {
    const result = monitoringPlanSchema.safeParse({
      name: "Plan",
      version: null,
      validFrom: null,
      validTo: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("authorisationSchema", () => {
  it("accepts valid authorisation data", () => {
    const result = authorisationSchema.safeParse({
      applicantName: "Ecosfer GmbH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty applicantName", () => {
    const result = authorisationSchema.safeParse({ applicantName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Basvuru sahibi adi gereklidir"
      );
    }
  });
});
