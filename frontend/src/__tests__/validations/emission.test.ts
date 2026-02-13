import { describe, it, expect } from "vitest";
import {
  emissionSchema,
  installationDataSchema,
  fuelBalanceSchema,
  ghgBalanceByTypeSchema,
} from "@/lib/validations/emission";

describe("emissionSchema", () => {
  it("accepts valid emission data", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-123",
      sourceStreamName: "Coal Combustion",
      adActivityData: "1234.56",
      efEmissionFactor: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty installationDataId", () => {
    const result = emissionSchema.safeParse({ installationDataId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Tesis verisi gereklidir");
    }
  });

  it("transforms string decimal to number", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      adActivityData: "123.45",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adActivityData).toBe(123.45);
    }
  });

  it("transforms number to number", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      adActivityData: 99.9,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adActivityData).toBe(99.9);
    }
  });

  it("transforms empty string to null", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      adActivityData: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adActivityData).toBeNull();
    }
  });

  it("transforms invalid string to null", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      adActivityData: "abc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adActivityData).toBeNull();
    }
  });

  it("accepts null for optional decimal fields", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      co2eFossil: null,
      co2eBio: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all PFC fields", () => {
    const result = emissionSchema.safeParse({
      installationDataId: "id-1",
      aFrequency: 1.0,
      aDuration: 2.0,
      aSefCf4: 0.5,
      bAeo: 0.1,
      bCe: 0.2,
      bOvc: 0.3,
      fC2f6: 0.4,
    });
    expect(result.success).toBe(true);
  });
});

describe("installationDataSchema", () => {
  it("accepts valid installation data", () => {
    const result = installationDataSchema.safeParse({
      installationId: "inst-123",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty installationId", () => {
    const result = installationDataSchema.safeParse({
      installationId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Tesis secimi gereklidir");
    }
  });

  it("accepts all nullable optional fields", () => {
    const result = installationDataSchema.safeParse({
      installationId: "inst-1",
      startDate: null,
      endDate: null,
      representativeId: null,
      supplierId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("fuelBalanceSchema", () => {
  it("accepts valid fuel balance data", () => {
    const result = fuelBalanceSchema.safeParse({
      installationDataId: "id-1",
      name: "Natural Gas",
      totalFuelInput: "500.0",
      directFuelForCbamGoods: "300.0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalFuelInput).toBe(500.0);
      expect(result.data.directFuelForCbamGoods).toBe(300.0);
    }
  });

  it("rejects empty installationDataId", () => {
    const result = fuelBalanceSchema.safeParse({
      installationDataId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("ghgBalanceByTypeSchema", () => {
  it("accepts valid GHG balance data", () => {
    const result = ghgBalanceByTypeSchema.safeParse({
      installationDataId: "id-1",
      name: "CO2",
      totalCo2Emissions: "1000.5",
      biomassEmissions: "50.0",
      totalDirectEmissions: "800.0",
      totalIndirectEmissions: "200.0",
      totalEmissions: "1000.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCo2Emissions).toBe(1000.5);
    }
  });
});
