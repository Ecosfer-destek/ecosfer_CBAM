import { z } from "zod";

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  });

export const emissionSchema = z.object({
  installationDataId: z.string().min(1, "Tesis verisi gereklidir"),
  sourceStreamName: z.string().optional().nullable(),
  technologyType: z.string().optional().nullable(),
  emissionTypeId: z.string().optional().nullable(),
  emissionMethodId: z.string().optional().nullable(),
  emissionMethod2Id: z.string().optional().nullable(),
  emissionMethod3Id: z.string().optional().nullable(),
  typeOfGhgId: z.string().optional().nullable(),

  // Activity Data + Units
  adActivityData: optionalDecimal,
  adUnitId: z.string().optional().nullable(),
  ncvNetCalorificValue: optionalDecimal,
  ncvUnitId: z.string().optional().nullable(),
  efEmissionFactor: optionalDecimal,
  efUnitId: z.string().optional().nullable(),
  ccCarbonContent: optionalDecimal,
  ccUnitId: z.string().optional().nullable(),
  oxfOxidationFactor: optionalDecimal,
  oxfUnitId: z.string().optional().nullable(),
  convfConversionFactor: optionalDecimal,
  convfUnitId: z.string().optional().nullable(),
  biocBiomassContent: optionalDecimal,
  biocUnitId: z.string().optional().nullable(),

  // GHG Emission Calculations
  tCf4Emission: optionalDecimal,
  tC2f6Emission: optionalDecimal,
  tCo2eGwpCf4: optionalDecimal,
  tCo2eGwpC2f6: optionalDecimal,
  tCo2eCf4Emission: optionalDecimal,
  tCo2eC2f6Emission: optionalDecimal,

  // CO2e
  collectionEfficiency: optionalDecimal,
  co2eFossil: optionalDecimal,
  co2eBio: optionalDecimal,

  // Energy
  energyContentBioTJ: optionalDecimal,
  energyContentTJ: optionalDecimal,

  // MBA
  hourlyGhgConcAverage: optionalDecimal,
  hourlyGhgConcUnitId: z.string().optional().nullable(),
  hoursOperating: optionalDecimal,
  hoursOperatingUnitId: z.string().optional().nullable(),
  flueGasFlowAverage: optionalDecimal,
  flueGasFlowUnitId: z.string().optional().nullable(),
  annualAmountOfGhg: optionalDecimal,
  annualAmountOfGhgUnitId: z.string().optional().nullable(),

  // GWP
  gwpTco2e: optionalDecimal,

  // PFC
  aFrequency: optionalDecimal,
  aDuration: optionalDecimal,
  aSefCf4: optionalDecimal,
  bAeo: optionalDecimal,
  bCe: optionalDecimal,
  bOvc: optionalDecimal,
  fC2f6: optionalDecimal,
});

export type EmissionInput = z.infer<typeof emissionSchema>;

export const installationDataSchema = z.object({
  installationId: z.string().min(1, "Tesis secimi gereklidir"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  representativeId: z.string().optional().nullable(),
  reportVerifierCompanyId: z.string().optional().nullable(),
  reportVerifierRepresentativeId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  reportCoverTitle: z.string().optional().nullable(),
  reportCoverContent: z.string().optional().nullable(),
});

export type InstallationDataInput = z.infer<typeof installationDataSchema>;

export const fuelBalanceSchema = z.object({
  installationDataId: z.string().min(1),
  name: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  totalFuelInput: optionalDecimal,
  directFuelForCbamGoods: optionalDecimal,
  fuelForElectricity: optionalDecimal,
  directFuelForNonCbamGoods: optionalDecimal,
  rest: optionalDecimal,
});

export type FuelBalanceInput = z.infer<typeof fuelBalanceSchema>;

export const ghgBalanceByTypeSchema = z.object({
  installationDataId: z.string().min(1),
  name: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  totalCo2Emissions: optionalDecimal,
  biomassEmissions: optionalDecimal,
  totalN2oEmissions: optionalDecimal,
  totalPfcEmissions: optionalDecimal,
  totalDirectEmissions: optionalDecimal,
  totalIndirectEmissions: optionalDecimal,
  totalEmissions: optionalDecimal,
});

export type GhgBalanceByTypeInput = z.infer<typeof ghgBalanceByTypeSchema>;
