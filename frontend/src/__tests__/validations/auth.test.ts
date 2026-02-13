import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
} from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "test@ecosfer.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "123456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("E-posta adresi gereklidir");
    }
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Gecerli bir e-posta adresi giriniz"
      );
    }
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "test@ecosfer.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Sifre en az 6 karakter olmalidir"
      );
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@ecosfer.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validInput = {
    name: "Test User",
    email: "test@ecosfer.com",
    password: "StrongPass1",
    confirmPassword: "StrongPass1",
    tenantId: "tenant-123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({ ...validInput, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "weakpass1",
      confirmPassword: "weakpass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Sifre en az bir buyuk harf icermelidir");
    }
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "WeakPassOnly",
      confirmPassword: "WeakPassOnly",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Sifre en az bir rakam icermelidir");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      confirmPassword: "DifferentPass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Sifreler eslesmiyor");
    }
  });

  it("rejects empty tenantId", () => {
    const result = registerSchema.safeParse({ ...validInput, tenantId: "" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid password change", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass123",
      newPassword: "NewPass123",
      confirmNewPassword: "NewPass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass123",
      newPassword: "NewPass123",
      confirmNewPassword: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass123",
      newPassword: "Short1",
      confirmNewPassword: "Short1",
    });
    expect(result.success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("accepts valid user creation data", () => {
    const result = createUserSchema.safeParse({
      name: "New User",
      email: "new@ecosfer.com",
      password: "StrongPass1",
      role: "OPERATOR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({
      name: "New User",
      email: "new@ecosfer.com",
      password: "StrongPass1",
      role: "INVALID_ROLE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid roles", () => {
    const roles = [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "OPERATOR",
      "SUPPLIER",
      "CBAM_DECLARANT",
      "VERIFIER",
    ];
    for (const role of roles) {
      const result = createUserSchema.safeParse({
        name: "User",
        email: "u@e.com",
        password: "StrongPass1",
        role,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateUserSchema", () => {
  it("accepts partial update", () => {
    const result = updateUserSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts isActive boolean", () => {
    const result = updateUserSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
