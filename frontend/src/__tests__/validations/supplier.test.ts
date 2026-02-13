import { describe, it, expect } from "vitest";
import {
  supplierSchema,
  supplierSurveySchema,
  supplierInviteSchema,
} from "@/lib/validations/supplier";

describe("supplierSchema", () => {
  it("accepts valid supplier data", () => {
    const result = supplierSchema.safeParse({ name: "Supplier A" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = supplierSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Tedarikci adi gereklidir"
      );
    }
  });

  it("accepts nullable optional fields", () => {
    const result = supplierSchema.safeParse({
      name: "Supplier A",
      taxNumber: null,
      taxOffice: null,
      companyId: null,
      userId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("supplierSurveySchema", () => {
  it("accepts valid survey data", () => {
    const result = supplierSurveySchema.safeParse({
      supplierId: "sup-123",
      value1: "45.67",
      value2: 89.12,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value1).toBe(45.67);
      expect(result.data.value2).toBe(89.12);
    }
  });

  it("rejects empty supplierId", () => {
    const result = supplierSurveySchema.safeParse({ supplierId: "" });
    expect(result.success).toBe(false);
  });

  it("transforms empty string value to null", () => {
    const result = supplierSurveySchema.safeParse({
      supplierId: "sup-1",
      value1: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value1).toBeNull();
    }
  });

  it("transforms invalid string value to null", () => {
    const result = supplierSurveySchema.safeParse({
      supplierId: "sup-1",
      value1: "not-a-number",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value1).toBeNull();
    }
  });
});

describe("supplierInviteSchema", () => {
  it("accepts valid invite data", () => {
    const result = supplierInviteSchema.safeParse({
      email: "supplier@example.com",
      name: "Supplier B",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = supplierInviteSchema.safeParse({
      email: "invalid",
      name: "Supplier B",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Gecerli bir e-posta adresi giriniz"
      );
    }
  });

  it("rejects empty name", () => {
    const result = supplierInviteSchema.safeParse({
      email: "s@e.com",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable companyId", () => {
    const result = supplierInviteSchema.safeParse({
      email: "s@e.com",
      name: "S",
      companyId: null,
    });
    expect(result.success).toBe(true);
  });
});
