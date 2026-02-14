"use server";

import { getTenantDb } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CBAM_SAMPLE_SECTORS } from "@/data/cbam-sample-data";
import { logError } from "@/lib/logger";

const SAMPLE_PREFIX = "[ÖRNEK] ";

/**
 * Check if sample data for a sector is already loaded in the current tenant.
 */
export async function checkSampleDataLoaded(sectorCode: string) {
  const sector = CBAM_SAMPLE_SECTORS.find((s) => s.code === sectorCode);
  if (!sector) return { loaded: false };

  const { db } = await getTenantDb();
  const company = await db.company.findFirst({
    where: { name: `${SAMPLE_PREFIX}${sector.company.name}` },
  });

  return { loaded: !!company };
}

/**
 * Load sample data for a sector into the current tenant's database.
 */
export async function loadSampleDataIntoTenant(sectorCode: string) {
  const sector = CBAM_SAMPLE_SECTORS.find((s) => s.code === sectorCode);
  if (!sector) return { error: "Geçersiz sektör kodu" };

  const { db, tenantId } = await getTenantDb();

  // Check if already loaded
  const existing = await db.company.findFirst({
    where: { name: `${SAMPLE_PREFIX}${sector.company.name}` },
  });
  if (existing) return { error: "Bu sektörün örnek verisi zaten yüklenmiş" };

  try {
    // Resolve country
    const country = await prisma.country.findFirst({
      where: { code: sector.company.countryCode },
    });

    // Resolve city
    const city = country
      ? await prisma.city.findFirst({
          where: { name: sector.company.cityName, countryId: country.id },
        })
      : null;

    // Create Company
    const company = await db.company.create({
      data: {
        name: `${SAMPLE_PREFIX}${sector.company.name}`,
        officialName: sector.company.officialName,
        address: sector.company.address,
        economicActivity: sector.company.economicActivity,
        email: sector.company.email,
        tenantId,
        countryId: country?.id ?? undefined,
        cityId: city?.id ?? undefined,
      },
    });

    // Resolve installation city (may differ from company city)
    const instCity = country
      ? await prisma.city.findFirst({
          where: {
            name: sector.installation.cityName,
            countryId: country.id,
          },
        })
      : null;

    // Create Installation
    const installation = await db.installation.create({
      data: {
        name: `${SAMPLE_PREFIX}${sector.installation.name}`,
        address: sector.installation.address,
        latitude: sector.installation.latitude,
        longitude: sector.installation.longitude,
        tenantId,
        companyId: company.id,
        countryId: country?.id ?? undefined,
        cityId: instCity?.id ?? city?.id ?? undefined,
      },
    });

    // Create InstallationData
    const installationData = await db.installationData.create({
      data: {
        startDate: new Date(sector.installation.startDate),
        endDate: new Date(sector.installation.endDate),
        tenantId,
        installationId: installation.id,
      },
    });

    // Resolve unit IDs for emissions
    const resolveUnit = async (
      model: string,
      code: string
    ): Promise<string | undefined> => {
      if (!code) return undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (prisma as any)[model].findFirst({
        where: { name: { contains: code } },
        select: { id: true },
      });
      return result?.id;
    };

    // Resolve emission types and methods
    const emissionTypeMap: Record<string, string | undefined> = {};
    for (const code of ["SS", "PFC", "ES"]) {
      const et = await prisma.emissionType.findFirst({
        where: { code },
        select: { id: true },
      });
      emissionTypeMap[code] = et?.id;
    }

    const emissionMethodMap: Record<string, string | undefined> = {};
    for (const em of sector.installation.emissions) {
      if (!emissionMethodMap[em.emissionMethodCode]) {
        const method = await prisma.emissionMethod.findFirst({
          where: { name: { contains: em.emissionMethodCode.substring(0, 20) } },
          select: { id: true },
        });
        emissionMethodMap[em.emissionMethodCode] = method?.id;
      }
    }

    const ghgTypeMap: Record<string, string | undefined> = {};
    for (const em of sector.installation.emissions) {
      if (!ghgTypeMap[em.typeOfGhgCode]) {
        const ghg = await prisma.typeOfGhg.findFirst({
          where: { name: { contains: em.typeOfGhgCode } },
          select: { id: true },
        });
        ghgTypeMap[em.typeOfGhgCode] = ghg?.id;
      }
    }

    // Create Emissions
    for (const em of sector.installation.emissions) {
      const adUnitId = await resolveUnit("aDUnit", em.adUnitCode);
      const ncvUnitId = em.ncvUnitCode
        ? await resolveUnit("nCVUnit", em.ncvUnitCode)
        : undefined;
      const efUnitId = await resolveUnit("eFUnit", em.efUnitCode);

      await db.emission.create({
        data: {
          sourceStreamName: em.sourceStreamName,
          installationDataId: installationData.id,
          emissionTypeId: emissionTypeMap[em.emissionTypeCode],
          emissionMethodId: emissionMethodMap[em.emissionMethodCode],
          typeOfGhgId: ghgTypeMap[em.typeOfGhgCode],
          adActivityData: em.adActivityData,
          adUnitId,
          ncvNetCalorificValue: em.ncvNetCalorificValue,
          ncvUnitId,
          efEmissionFactor: em.efEmissionFactor,
          efUnitId,
          oxfOxidationFactor: em.oxfOxidationFactor,
          co2eFossil: em.co2eFossil,
          co2eBio: em.co2eBio,
          energyContentTJ: em.energyContentTJ,
        },
      });
    }

    // Create Fuel Balances
    for (const fb of sector.installation.fuelBalances) {
      await db.fuelBalance.create({
        data: {
          name: fb.name,
          totalFuelInput: fb.totalFuelInput,
          directFuelForCbamGoods: fb.directFuelForCbamGoods,
          fuelForElectricity: fb.fuelForElectricity,
          directFuelForNonCbamGoods: fb.directFuelForNonCbamGoods,
          rest: fb.rest,
          installationDataId: installationData.id,
        },
      });
    }

    // Create GHG Balances
    for (const ghg of sector.installation.ghgBalances) {
      await db.ghgBalanceByType.create({
        data: {
          name: ghg.name,
          totalCo2Emissions: ghg.totalCo2Emissions,
          biomassEmissions: ghg.biomassEmissions,
          totalN2oEmissions: ghg.totalN2oEmissions,
          totalPfcEmissions: ghg.totalPfcEmissions,
          totalDirectEmissions: ghg.totalDirectEmissions,
          totalIndirectEmissions: ghg.totalIndirectEmissions,
          totalEmissions: ghg.totalEmissions,
          installationDataId: installationData.id,
        },
      });
    }

    // Create Production Processes
    for (const pp of sector.installation.productionProcesses) {
      const goodsCategory = await prisma.goodsCategory.findFirst({
        where: { code: pp.goodsCategoryCode },
        select: { id: true },
      });

      await db.relevantProductionProcess.create({
        data: {
          name: pp.name,
          installationDataId: installationData.id,
          goodsCategoryId: goodsCategory?.id,
          dTotalProductionLevelTotalProductionWithinInstallation:
            pp.totalProduction,
          dProducedForTheMarket: pp.producedForMarket,
          dDirectlyAttributableEmissionsValue: pp.directlyAttributable,
        },
      });
    }

    return { success: true };
  } catch (e) {
    logError("cbam-reference.loadSampleData", e);
    return { error: "Örnek veri yüklenirken bir hata oluştu" };
  }
}

/**
 * Delete sample data for a sector from the current tenant.
 * Cascade deletes: Company -> Installation -> InstallationData -> Emissions, Balances, Processes
 */
export async function deleteSampleDataFromTenant(sectorCode: string) {
  const sector = CBAM_SAMPLE_SECTORS.find((s) => s.code === sectorCode);
  if (!sector) return { error: "Geçersiz sektör kodu" };

  const { db } = await getTenantDb();

  try {
    const company = await db.company.findFirst({
      where: { name: `${SAMPLE_PREFIX}${sector.company.name}` },
      include: {
        installations: {
          include: {
            installationDatas: { select: { id: true } },
          },
        },
      },
    });

    if (!company) return { error: "Örnek veri bulunamadı" };

    // Delete in reverse order to respect foreign keys
    for (const inst of company.installations) {
      for (const instData of inst.installationDatas) {
        // Cascade delete handles emissions, balances, processes
        await db.installationData.delete({ where: { id: instData.id } });
      }
      await db.installation.delete({ where: { id: inst.id } });
    }

    await db.company.delete({ where: { id: company.id } });

    return { success: true };
  } catch (e) {
    logError("cbam-reference.deleteSampleData", e);
    return { error: "Örnek veri silinirken bir hata oluştu" };
  }
}
