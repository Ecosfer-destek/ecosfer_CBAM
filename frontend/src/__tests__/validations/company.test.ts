import { describe, it, expect } from "vitest";
import {
  companySchema,
  installationSchema,
  personSchema,
} from "@/lib/validations/company";

describe("companySchema", () => {
  it("accepts valid company data", () => {
    const result = companySchema.safeParse({
      name: "Ecosfer Danismanlik",
      email: "info@ecosfer.com",
      taxNumber: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = companySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sirket adi gereklidir");
    }
  });

  it("rejects tax number longer than 11 chars", () => {
    const result = companySchema.safeParse({
      name: "Test Co",
      taxNumber: "123456789012",
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable optional fields", () => {
    const result = companySchema.safeParse({
      name: "Test Co",
      officialName: null,
      address: null,
      email: null,
      countryId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = companySchema.safeParse({
      name: "Test Co",
      email: "not-valid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = companySchema.safeParse({
      name: "Test Co",
      email: "valid@example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("installationSchema", () => {
  it("accepts valid installation data", () => {
    const result = installationSchema.safeParse({
      name: "Tesis Alpha",
      companyId: "company-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = installationSchema.safeParse({
      name: "",
      companyId: "company-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty companyId", () => {
    const result = installationSchema.safeParse({
      name: "Tesis Alpha",
      companyId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sirket secimi gereklidir");
    }
  });

  it("rejects name exceeding 1024 chars", () => {
    const result = installationSchema.safeParse({
      name: "A".repeat(1025),
      companyId: "company-123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional nullable location fields", () => {
    const result = installationSchema.safeParse({
      name: "Tesis",
      companyId: "c-1",
      latitude: null,
      longitude: null,
      countryId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("personSchema", () => {
  it("accepts valid person data", () => {
    const result = personSchema.safeParse({
      firstName: "Ahmet",
      lastName: "Yilmaz",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty firstName", () => {
    const result = personSchema.safeParse({ firstName: "", lastName: "Y" });
    expect(result.success).toBe(false);
  });

  it("rejects empty lastName", () => {
    const result = personSchema.safeParse({ firstName: "A", lastName: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional email and phone", () => {
    const result = personSchema.safeParse({
      firstName: "A",
      lastName: "B",
      email: null,
      phone: null,
    });
    expect(result.success).toBe(true);
  });
});
