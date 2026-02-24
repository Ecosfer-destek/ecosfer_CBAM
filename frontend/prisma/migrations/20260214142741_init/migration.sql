-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('UNDEFINED', 'ALL_PRODUCTION_ROUTES', 'DEFINED_ROUTES');

-- CreateEnum
CREATE TYPE "ReportPart" AS ENUM ('UNDEFINED', 'PART1', 'PART2', 'PART3');

-- CreateEnum
CREATE TYPE "ReportSectionLevel" AS ENUM ('UNDEFINED', 'HEADING', 'SUB_HEADING');

-- CreateEnum
CREATE TYPE "ReportSectionContentType" AS ENUM ('UNDEFINED', 'TEXT', 'IMAGE', 'CBAM_TABLE');

-- CreateEnum
CREATE TYPE "CbamFileSendStatus" AS ENUM ('UNDEFINED', 'PREPARING', 'WAITING_FOR_APPROVAL', 'READY', 'SENDING_IN_PROCESS', 'SENT');

-- CreateEnum
CREATE TYPE "SpecificEmbeddedEmissionSource" AS ENUM ('UNDEFINED', 'UNKNOWN', 'MEASURED', 'DEFAULT');

-- CreateEnum
CREATE TYPE "ElectricityEmissionFactor" AS ENUM ('UNDEFINED', 'D400A', 'D400B', 'D410', 'D420', 'D431', 'D432', 'MIX');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATOR', 'SUPPLIER', 'CBAM_DECLARANT', 'VERIFIER');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'AMENDED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'SURRENDERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuthorisationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VerificationOpinion" AS ENUM ('UNQUALIFIED', 'QUALIFIED', 'ADVERSE', 'DISCLAIMER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_infos" (
    "id" TEXT NOT NULL,
    "loginProvider" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_login_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTr" TEXT,
    "nameDe" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_offices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cn_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goodsCategoryId" TEXT NOT NULL,

    CONSTRAINT "cn_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_routes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_processes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "taxNumber" TEXT,
    "address" TEXT,
    "postCode" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "unlocode" TEXT,
    "poBox" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "economicActivity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "countryId" TEXT,
    "cityId" TEXT,
    "districtId" TEXT,
    "taxOfficeId" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "postCode" TEXT,
    "poBox" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "unlocode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "countryId" TEXT,
    "cityId" TEXT,
    "districtId" TEXT,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_production_activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "company_production_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_datas" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isInImportFromExcelProcess" BOOLEAN NOT NULL DEFAULT false,
    "cbamFileStatus" "CbamFileSendStatus" NOT NULL DEFAULT 'UNDEFINED',
    "reportCoverTitle" TEXT,
    "reportCoverContent" TEXT,
    "reportCoverImageUrl" TEXT,
    "companyLogoUrl" TEXT,
    "excelFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "representativeId" TEXT,
    "reportVerifierCompanyId" TEXT,
    "reportVerifierRepresentativeId" TEXT,
    "supplierId" TEXT,
    "generalInfoOnDataQualityId" TEXT,
    "justificationForDefaultValueId" TEXT,
    "infoOnQualityAssuranceId" TEXT,

    CONSTRAINT "installation_datas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_goods_category_and_routes" (
    "id" TEXT NOT NULL,
    "routeType" "RouteType" NOT NULL DEFAULT 'UNDEFINED',
    "route1" TEXT,
    "route2" TEXT,
    "route3" TEXT,
    "route4" TEXT,
    "route5" TEXT,
    "route6" TEXT,
    "route7" TEXT,
    "route8" TEXT,
    "route9" TEXT,
    "route10" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT NOT NULL,
    "goodsCategoryId" TEXT,

    CONSTRAINT "installation_goods_category_and_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emissions" (
    "id" TEXT NOT NULL,
    "sourceStreamName" TEXT,
    "technologyType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installationDataId" TEXT NOT NULL,
    "emissionTypeId" TEXT,
    "emissionMethodId" TEXT,
    "emissionMethod2Id" TEXT,
    "emissionMethod3Id" TEXT,
    "typeOfGhgId" TEXT,
    "adActivityData" DECIMAL(28,10),
    "adUnitId" TEXT,
    "ncvNetCalorificValue" DECIMAL(28,10),
    "ncvUnitId" TEXT,
    "efEmissionFactor" DECIMAL(28,10),
    "efUnitId" TEXT,
    "ccCarbonContent" DECIMAL(28,10),
    "ccUnitId" TEXT,
    "oxfOxidationFactor" DECIMAL(28,10),
    "oxfUnitId" TEXT,
    "convfConversionFactor" DECIMAL(28,10),
    "convfUnitId" TEXT,
    "biocBiomassContent" DECIMAL(28,10),
    "biocUnitId" TEXT,
    "tCf4Emission" DECIMAL(28,10),
    "tC2f6Emission" DECIMAL(28,10),
    "tCo2eGwpCf4" DECIMAL(28,10),
    "tCo2eGwpC2f6" DECIMAL(28,10),
    "tCo2eCf4Emission" DECIMAL(28,10),
    "tCo2eC2f6Emission" DECIMAL(28,10),
    "collectionEfficiency" DECIMAL(28,10),
    "co2eFossil" DECIMAL(28,10),
    "co2eBio" DECIMAL(28,10),
    "energyContentBioTJ" DECIMAL(28,10),
    "energyContentTJ" DECIMAL(28,10),
    "hourlyGhgConcAverage" DECIMAL(28,10),
    "hourlyGhgConcUnitId" TEXT,
    "hoursOperating" DECIMAL(28,10),
    "hoursOperatingUnitId" TEXT,
    "flueGasFlowAverage" DECIMAL(28,10),
    "flueGasFlowUnitId" TEXT,
    "annualAmountOfGhg" DECIMAL(28,10),
    "annualAmountOfGhgUnitId" TEXT,
    "gwpTco2e" DECIMAL(28,10),
    "aFrequency" DECIMAL(28,10),
    "aDuration" DECIMAL(28,10),
    "aSefCf4" DECIMAL(28,10),
    "bAeo" DECIMAL(28,10),
    "bCe" DECIMAL(28,10),
    "bOvc" DECIMAL(28,10),
    "fC2f6" DECIMAL(28,10),

    CONSTRAINT "emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_methods" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_methods_2" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_methods_2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_methods_3" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_methods_3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_of_ghg" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gwp" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "types_of_ghg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncv_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncv_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ef_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ef_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ccontent_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ccontent_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oxf_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oxf_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convf_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convf_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bioc_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bioc_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_balance_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_balance_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghg_balance_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ghg_balance_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghg_conc_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ghg_conc_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hours_operating_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hours_operating_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flue_gas_flow_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flue_gas_flow_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_amount_of_ghg_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_amount_of_ghg_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_stream_names" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_stream_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_balances" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "totalFuelInput" DECIMAL(28,10),
    "directFuelForCbamGoods" DECIMAL(28,10),
    "fuelForElectricity" DECIMAL(28,10),
    "directFuelForNonCbamGoods" DECIMAL(28,10),
    "rest" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "fuel_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghg_balance_by_types" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "totalCo2Emissions" DECIMAL(28,10),
    "biomassEmissions" DECIMAL(28,10),
    "totalN2oEmissions" DECIMAL(28,10),
    "totalPfcEmissions" DECIMAL(28,10),
    "totalDirectEmissions" DECIMAL(28,10),
    "totalIndirectEmissions" DECIMAL(28,10),
    "totalEmissions" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "ghg_balance_by_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghg_balance_by_monitoring_methodology_types" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "calculationBasedExclPfcEmissions" DECIMAL(28,10),
    "totalPfcEmissions" DECIMAL(28,10),
    "measurementBased" DECIMAL(28,10),
    "other" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "ghg_balance_by_monitoring_methodology_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relevant_production_processes" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installationDataId" TEXT NOT NULL,
    "goodsCategoryId" TEXT,
    "productionProcess1" TEXT,
    "productionProcess2" TEXT,
    "productionProcess3" TEXT,
    "productionProcess4" TEXT,
    "productionProcess5" TEXT,
    "productionProcess6" TEXT,
    "productionProcess7" TEXT,
    "productionProcess8" TEXT,
    "productionProcess9" TEXT,
    "productionProcess10" TEXT,
    "dTotalProductionLevelTotalProductionWithinInstallation" DECIMAL(28,10),
    "dProducedForTheMarket" DECIMAL(28,10),
    "dShareOfTotalUnderProducedForTheMarket" DECIMAL(28,10),
    "dConsumedForNonCbamGoodsWithinTheInstallation" DECIMAL(28,10),
    "control" DECIMAL(28,10),
    "dApplicableElementsMeasurableHeat" BOOLEAN NOT NULL DEFAULT false,
    "dApplicableElementsWasteGases" BOOLEAN NOT NULL DEFAULT false,
    "dApplicableElementsIndirectEmissions" BOOLEAN NOT NULL DEFAULT true,
    "dDirectlyAttributableEmissionsValue" DECIMAL(28,10),
    "dEmissionsFromHeatBalanceValue" DECIMAL(28,10),
    "dEmissionsFromWasteGasesBalanceValue" DECIMAL(28,10),
    "dMeasurableHeatAmountImported" DECIMAL(28,10),
    "dMeasurableHeatAmountExported" DECIMAL(28,10),
    "dMeasurableHeatEmissionsFactorImported" DECIMAL(28,10),
    "dMeasurableHeatEmissionsFactorExported" DECIMAL(28,10),
    "dWasteGasesAmountImported" DECIMAL(28,10),
    "dWasteGasesAmountExported" DECIMAL(28,10),
    "dWasteGasesEmissionsFactorImported" DECIMAL(28,10),
    "dWasteGasesEmissionsFactorExported" DECIMAL(28,10),
    "dIndirectEmissionsElectricityConsumption" DECIMAL(28,10),
    "dIndirectEmissionsEmissionFactorValue" DECIMAL(28,10),
    "dIndirectEmissionsSourceOfEmissionFactor" "ElectricityEmissionFactor" NOT NULL DEFAULT 'UNDEFINED',
    "dElectricityExportedAmountsExported" DECIMAL(28,10),
    "dElectricityExportedEmissionFactorValue" DECIMAL(28,10),

    CONSTRAINT "relevant_production_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_total_production_levels" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relevantProductionProcessId" TEXT NOT NULL,

    CONSTRAINT "d_total_production_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_consumed_in_other" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relevantProductionProcessId" TEXT NOT NULL,

    CONSTRAINT "d_consumed_in_other_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_precursors" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installationDataId" TEXT NOT NULL,
    "goodsCategoryId" TEXT,
    "countryId" TEXT,
    "route1" TEXT,
    "route2" TEXT,
    "route3" TEXT,
    "route4" TEXT,
    "route5" TEXT,
    "route6" TEXT,
    "route7" TEXT,
    "route8" TEXT,
    "route9" TEXT,
    "route10" TEXT,
    "eTotalPurchaseForPossibleConsumption" DECIMAL(28,10),
    "eConsumedForOtherPurposesForNonCbam" DECIMAL(28,10),
    "control" DECIMAL(28,10),
    "eSpecificEmbedEmissions" TEXT,
    "eSpecificEmbedDirectEmissionsValue" DECIMAL(28,10),
    "eSpecificEmbedDirectEmissionsSource" "SpecificEmbeddedEmissionSource" NOT NULL DEFAULT 'UNDEFINED',
    "eSpecificElectricityConsumptionValue" DECIMAL(28,10),
    "eSpecificElectricityConsumptionSource" "SpecificEmbeddedEmissionSource" NOT NULL DEFAULT 'UNDEFINED',
    "eElectricityEmissionFactorValue" DECIMAL(28,10),
    "eElectricityEmissionFactorSource" "ElectricityEmissionFactor" NOT NULL DEFAULT 'UNDEFINED',
    "eSpecificEmbeddedIndirectEmissionsValue" DECIMAL(28,10),
    "eJustificationId" TEXT,

    CONSTRAINT "purchased_precursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_total_purchased_levels" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasedPrecursorId" TEXT NOT NULL,

    CONSTRAINT "e_total_purchased_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_consumed_in_production" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(28,10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasedPrecursorId" TEXT NOT NULL,

    CONSTRAINT "e_consumed_in_production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbam_reports" (
    "id" TEXT NOT NULL,
    "reportPeriod" TEXT,
    "reportTemplate" TEXT,
    "downloadUrl" TEXT,
    "excelFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT NOT NULL,

    CONSTRAINT "cbam_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "coverTitle" TEXT,
    "coverContent" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sections" (
    "id" TEXT NOT NULL,
    "part" "ReportPart" NOT NULL DEFAULT 'UNDEFINED',
    "sectionCode" TEXT,
    "sectionTitle" TEXT,
    "sectionLevel" "ReportSectionLevel" NOT NULL DEFAULT 'UNDEFINED',
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationDataId" TEXT,
    "reportId" TEXT,

    CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_section_contents" (
    "id" TEXT NOT NULL,
    "contentType" "ReportSectionContentType" NOT NULL DEFAULT 'UNDEFINED',
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportSectionId" TEXT NOT NULL,

    CONSTRAINT "report_section_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_verifier_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "report_verifier_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_verifier_representatives" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifierCompanyId" TEXT,

    CONSTRAINT "report_verifier_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_info_on_data_quality" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "qualityLevel" TEXT,
    "methodDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_info_on_data_quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justification_for_default_values" (
    "id" TEXT NOT NULL,
    "justification" TEXT,
    "source" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "justification_for_default_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_on_quality_assurance" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "methodology" TEXT,
    "frequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "info_on_quality_assurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_justification_for_default_values" (
    "id" TEXT NOT NULL,
    "justification" TEXT,
    "source" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "e_justification_for_default_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "taxOffice" TEXT,
    "contactPerson" TEXT,
    "invitationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3),
    "invitationToken" TEXT,
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "countryId" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_surveys" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reportingPeriodStart" TIMESTAMP(3),
    "reportingPeriodEnd" TIMESTAMP(3),
    "specificEmbeddedEmissions" DECIMAL(28,10),
    "directEmissions" DECIMAL(28,10),
    "indirectEmissions" DECIMAL(28,10),
    "productionVolume" DECIMAL(28,10),
    "electricityConsumption" DECIMAL(28,10),
    "heatConsumption" DECIMAL(28,10),
    "emissionFactorSource" TEXT,
    "monitoringMethodology" TEXT,
    "value1" DECIMAL(28,10),
    "value2" DECIMAL(28,10),
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "supplierGoodId" TEXT,
    "supplierUnitId" TEXT,
    "supplierCalId" TEXT,

    CONSTRAINT "supplier_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_goods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "cnCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT,
    "goodsCategoryId" TEXT,

    CONSTRAINT "supplier_goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_cals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_cals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_setups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scopes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_declarations" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'DRAFT',
    "submissionDate" TIMESTAMP(3),
    "totalEmissions" DECIMAL(28,10),
    "totalCertificates" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "annual_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbam_certificates" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "pricePerTonne" DECIMAL(18,4),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "cbam_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_surrenders" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "surrenderDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateId" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "certificate_surrenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_allocation_adjustments" (
    "id" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "amount" DECIMAL(28,10),
    "description" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "free_allocation_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "description" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "monitoring_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "verificationPeriod" TEXT,
    "opinion" "VerificationOpinion" NOT NULL DEFAULT 'UNQUALIFIED',
    "documentUrl" TEXT,
    "verifierName" TEXT,
    "verifierAccreditation" TEXT,
    "issueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorisation_applications" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT,
    "status" "AuthorisationStatus" NOT NULL DEFAULT 'PENDING',
    "applicantName" TEXT NOT NULL,
    "applicantType" TEXT,
    "submissionDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "authorisation_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_registrations" (
    "id" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "registrationNo" TEXT,
    "registrationDate" TIMESTAMP(3),
    "installationName" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "operator_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accredited_verifiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accreditationNo" TEXT,
    "accreditationBody" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "accredited_verifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indirect_customs_representatives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eoriNumber" TEXT,
    "representedParty" TEXT,
    "authorizationRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "indirect_customs_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eoriNumber" TEXT,
    "isDeMinimis" BOOLEAN NOT NULL DEFAULT false,
    "deMinimisAmount" DECIMAL(18,4),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "countryId" TEXT,

    CONSTRAINT "importers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_value_tables" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "region" TEXT,
    "value" DECIMAL(28,10),
    "unit" TEXT,
    "source" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_value_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_login_infos_loginProvider_providerKey_key" ON "user_login_infos"("loginProvider", "providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "cities_countryId_idx" ON "cities"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_countryId_key" ON "cities"("name", "countryId");

-- CreateIndex
CREATE INDEX "districts_cityId_idx" ON "districts"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_cityId_key" ON "districts"("name", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "goods_categories_code_key" ON "goods_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cn_codes_code_key" ON "cn_codes"("code");

-- CreateIndex
CREATE INDEX "cn_codes_goodsCategoryId_idx" ON "cn_codes"("goodsCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "production_routes_code_key" ON "production_routes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "production_processes_code_key" ON "production_processes"("code");

-- CreateIndex
CREATE INDEX "companies_tenantId_idx" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "installations_tenantId_idx" ON "installations"("tenantId");

-- CreateIndex
CREATE INDEX "installations_companyId_idx" ON "installations"("companyId");

-- CreateIndex
CREATE INDEX "company_production_activities_companyId_idx" ON "company_production_activities"("companyId");

-- CreateIndex
CREATE INDEX "persons_tenantId_idx" ON "persons"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "installation_datas_generalInfoOnDataQualityId_key" ON "installation_datas"("generalInfoOnDataQualityId");

-- CreateIndex
CREATE UNIQUE INDEX "installation_datas_justificationForDefaultValueId_key" ON "installation_datas"("justificationForDefaultValueId");

-- CreateIndex
CREATE UNIQUE INDEX "installation_datas_infoOnQualityAssuranceId_key" ON "installation_datas"("infoOnQualityAssuranceId");

-- CreateIndex
CREATE INDEX "installation_datas_tenantId_idx" ON "installation_datas"("tenantId");

-- CreateIndex
CREATE INDEX "installation_datas_installationId_idx" ON "installation_datas"("installationId");

-- CreateIndex
CREATE INDEX "installation_goods_category_and_routes_installationDataId_idx" ON "installation_goods_category_and_routes"("installationDataId");

-- CreateIndex
CREATE INDEX "emissions_installationDataId_idx" ON "emissions"("installationDataId");

-- CreateIndex
CREATE UNIQUE INDEX "emission_types_code_key" ON "emission_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "emission_methods_code_key" ON "emission_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "emission_methods_2_code_key" ON "emission_methods_2"("code");

-- CreateIndex
CREATE UNIQUE INDEX "emission_methods_3_code_key" ON "emission_methods_3"("code");

-- CreateIndex
CREATE UNIQUE INDEX "types_of_ghg_code_key" ON "types_of_ghg"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ad_units_code_key" ON "ad_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ncv_units_code_key" ON "ncv_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ef_units_code_key" ON "ef_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ccontent_units_code_key" ON "ccontent_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "oxf_units_code_key" ON "oxf_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "convf_units_code_key" ON "convf_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bioc_units_code_key" ON "bioc_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_balance_units_code_key" ON "fuel_balance_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ghg_balance_units_code_key" ON "ghg_balance_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ghg_conc_units_code_key" ON "ghg_conc_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hours_operating_units_code_key" ON "hours_operating_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "flue_gas_flow_units_code_key" ON "flue_gas_flow_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "annual_amount_of_ghg_units_code_key" ON "annual_amount_of_ghg_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "source_stream_names_code_key" ON "source_stream_names"("code");

-- CreateIndex
CREATE INDEX "fuel_balances_installationDataId_idx" ON "fuel_balances"("installationDataId");

-- CreateIndex
CREATE INDEX "ghg_balance_by_types_installationDataId_idx" ON "ghg_balance_by_types"("installationDataId");

-- CreateIndex
CREATE INDEX "ghg_balance_by_monitoring_methodology_types_installationDat_idx" ON "ghg_balance_by_monitoring_methodology_types"("installationDataId");

-- CreateIndex
CREATE INDEX "relevant_production_processes_installationDataId_idx" ON "relevant_production_processes"("installationDataId");

-- CreateIndex
CREATE INDEX "d_total_production_levels_relevantProductionProcessId_idx" ON "d_total_production_levels"("relevantProductionProcessId");

-- CreateIndex
CREATE INDEX "d_consumed_in_other_relevantProductionProcessId_idx" ON "d_consumed_in_other"("relevantProductionProcessId");

-- CreateIndex
CREATE UNIQUE INDEX "purchased_precursors_eJustificationId_key" ON "purchased_precursors"("eJustificationId");

-- CreateIndex
CREATE INDEX "purchased_precursors_installationDataId_idx" ON "purchased_precursors"("installationDataId");

-- CreateIndex
CREATE INDEX "e_total_purchased_levels_purchasedPrecursorId_idx" ON "e_total_purchased_levels"("purchasedPrecursorId");

-- CreateIndex
CREATE INDEX "e_consumed_in_production_purchasedPrecursorId_idx" ON "e_consumed_in_production"("purchasedPrecursorId");

-- CreateIndex
CREATE INDEX "cbam_reports_installationDataId_idx" ON "cbam_reports"("installationDataId");

-- CreateIndex
CREATE INDEX "reports_tenantId_idx" ON "reports"("tenantId");

-- CreateIndex
CREATE INDEX "report_sections_installationDataId_idx" ON "report_sections"("installationDataId");

-- CreateIndex
CREATE INDEX "report_sections_reportId_idx" ON "report_sections"("reportId");

-- CreateIndex
CREATE INDEX "report_section_contents_reportSectionId_idx" ON "report_section_contents"("reportSectionId");

-- CreateIndex
CREATE INDEX "report_templates_tenantId_idx" ON "report_templates"("tenantId");

-- CreateIndex
CREATE INDEX "report_verifier_companies_tenantId_idx" ON "report_verifier_companies"("tenantId");

-- CreateIndex
CREATE INDEX "report_verifier_representatives_verifierCompanyId_idx" ON "report_verifier_representatives"("verifierCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_invitationToken_key" ON "suppliers"("invitationToken");

-- CreateIndex
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");

-- CreateIndex
CREATE INDEX "suppliers_companyId_idx" ON "suppliers"("companyId");

-- CreateIndex
CREATE INDEX "supplier_surveys_supplierId_idx" ON "supplier_surveys"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_goods_supplierId_idx" ON "supplier_goods"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_units_code_key" ON "supplier_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_cals_code_key" ON "supplier_cals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_tenantId_key_key" ON "app_settings"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "app_setups_key_key" ON "app_setups"("key");

-- CreateIndex
CREATE UNIQUE INDEX "scopes_name_key" ON "scopes"("name");

-- CreateIndex
CREATE INDEX "annual_declarations_tenantId_idx" ON "annual_declarations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "annual_declarations_tenantId_year_key" ON "annual_declarations"("tenantId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "cbam_certificates_certificateNo_key" ON "cbam_certificates"("certificateNo");

-- CreateIndex
CREATE INDEX "cbam_certificates_tenantId_idx" ON "cbam_certificates"("tenantId");

-- CreateIndex
CREATE INDEX "certificate_surrenders_certificateId_idx" ON "certificate_surrenders"("certificateId");

-- CreateIndex
CREATE INDEX "certificate_surrenders_declarationId_idx" ON "certificate_surrenders"("declarationId");

-- CreateIndex
CREATE INDEX "free_allocation_adjustments_declarationId_idx" ON "free_allocation_adjustments"("declarationId");

-- CreateIndex
CREATE INDEX "monitoring_plans_tenantId_idx" ON "monitoring_plans"("tenantId");

-- CreateIndex
CREATE INDEX "verification_documents_tenantId_idx" ON "verification_documents"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "authorisation_applications_applicationNo_key" ON "authorisation_applications"("applicationNo");

-- CreateIndex
CREATE INDEX "authorisation_applications_tenantId_idx" ON "authorisation_applications"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "operator_registrations_registrationNo_key" ON "operator_registrations"("registrationNo");

-- CreateIndex
CREATE INDEX "operator_registrations_tenantId_idx" ON "operator_registrations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "accredited_verifiers_accreditationNo_key" ON "accredited_verifiers"("accreditationNo");

-- CreateIndex
CREATE INDEX "accredited_verifiers_tenantId_idx" ON "accredited_verifiers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "indirect_customs_representatives_eoriNumber_key" ON "indirect_customs_representatives"("eoriNumber");

-- CreateIndex
CREATE INDEX "indirect_customs_representatives_tenantId_idx" ON "indirect_customs_representatives"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "importers_eoriNumber_key" ON "importers"("eoriNumber");

-- CreateIndex
CREATE INDEX "importers_tenantId_idx" ON "importers"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_infos" ADD CONSTRAINT "user_login_infos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cn_codes" ADD CONSTRAINT "cn_codes_goodsCategoryId_fkey" FOREIGN KEY ("goodsCategoryId") REFERENCES "goods_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_taxOfficeId_fkey" FOREIGN KEY ("taxOfficeId") REFERENCES "tax_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_production_activities" ADD CONSTRAINT "company_production_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "installations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_reportVerifierCompanyId_fkey" FOREIGN KEY ("reportVerifierCompanyId") REFERENCES "report_verifier_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_reportVerifierRepresentativeId_fkey" FOREIGN KEY ("reportVerifierRepresentativeId") REFERENCES "report_verifier_representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_generalInfoOnDataQualityId_fkey" FOREIGN KEY ("generalInfoOnDataQualityId") REFERENCES "general_info_on_data_quality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_justificationForDefaultValueId_fkey" FOREIGN KEY ("justificationForDefaultValueId") REFERENCES "justification_for_default_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_datas" ADD CONSTRAINT "installation_datas_infoOnQualityAssuranceId_fkey" FOREIGN KEY ("infoOnQualityAssuranceId") REFERENCES "info_on_quality_assurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_goods_category_and_routes" ADD CONSTRAINT "installation_goods_category_and_routes_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_goods_category_and_routes" ADD CONSTRAINT "installation_goods_category_and_routes_goodsCategoryId_fkey" FOREIGN KEY ("goodsCategoryId") REFERENCES "goods_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_emissionTypeId_fkey" FOREIGN KEY ("emissionTypeId") REFERENCES "emission_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_emissionMethodId_fkey" FOREIGN KEY ("emissionMethodId") REFERENCES "emission_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_emissionMethod2Id_fkey" FOREIGN KEY ("emissionMethod2Id") REFERENCES "emission_methods_2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_emissionMethod3Id_fkey" FOREIGN KEY ("emissionMethod3Id") REFERENCES "emission_methods_3"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_typeOfGhgId_fkey" FOREIGN KEY ("typeOfGhgId") REFERENCES "types_of_ghg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_adUnitId_fkey" FOREIGN KEY ("adUnitId") REFERENCES "ad_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_ncvUnitId_fkey" FOREIGN KEY ("ncvUnitId") REFERENCES "ncv_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_efUnitId_fkey" FOREIGN KEY ("efUnitId") REFERENCES "ef_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_ccUnitId_fkey" FOREIGN KEY ("ccUnitId") REFERENCES "ccontent_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_oxfUnitId_fkey" FOREIGN KEY ("oxfUnitId") REFERENCES "oxf_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_convfUnitId_fkey" FOREIGN KEY ("convfUnitId") REFERENCES "convf_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_biocUnitId_fkey" FOREIGN KEY ("biocUnitId") REFERENCES "bioc_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_hourlyGhgConcUnitId_fkey" FOREIGN KEY ("hourlyGhgConcUnitId") REFERENCES "ghg_conc_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_hoursOperatingUnitId_fkey" FOREIGN KEY ("hoursOperatingUnitId") REFERENCES "hours_operating_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_flueGasFlowUnitId_fkey" FOREIGN KEY ("flueGasFlowUnitId") REFERENCES "flue_gas_flow_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_annualAmountOfGhgUnitId_fkey" FOREIGN KEY ("annualAmountOfGhgUnitId") REFERENCES "annual_amount_of_ghg_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_balances" ADD CONSTRAINT "fuel_balances_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_balances" ADD CONSTRAINT "fuel_balances_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "fuel_balance_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghg_balance_by_types" ADD CONSTRAINT "ghg_balance_by_types_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghg_balance_by_types" ADD CONSTRAINT "ghg_balance_by_types_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ghg_balance_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghg_balance_by_monitoring_methodology_types" ADD CONSTRAINT "ghg_balance_by_monitoring_methodology_types_installationDa_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghg_balance_by_monitoring_methodology_types" ADD CONSTRAINT "ghg_balance_by_monitoring_methodology_types_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ghg_balance_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relevant_production_processes" ADD CONSTRAINT "relevant_production_processes_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relevant_production_processes" ADD CONSTRAINT "relevant_production_processes_goodsCategoryId_fkey" FOREIGN KEY ("goodsCategoryId") REFERENCES "goods_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_total_production_levels" ADD CONSTRAINT "d_total_production_levels_relevantProductionProcessId_fkey" FOREIGN KEY ("relevantProductionProcessId") REFERENCES "relevant_production_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_consumed_in_other" ADD CONSTRAINT "d_consumed_in_other_relevantProductionProcessId_fkey" FOREIGN KEY ("relevantProductionProcessId") REFERENCES "relevant_production_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_precursors" ADD CONSTRAINT "purchased_precursors_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_precursors" ADD CONSTRAINT "purchased_precursors_goodsCategoryId_fkey" FOREIGN KEY ("goodsCategoryId") REFERENCES "goods_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_precursors" ADD CONSTRAINT "purchased_precursors_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_precursors" ADD CONSTRAINT "purchased_precursors_eJustificationId_fkey" FOREIGN KEY ("eJustificationId") REFERENCES "e_justification_for_default_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e_total_purchased_levels" ADD CONSTRAINT "e_total_purchased_levels_purchasedPrecursorId_fkey" FOREIGN KEY ("purchasedPrecursorId") REFERENCES "purchased_precursors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e_consumed_in_production" ADD CONSTRAINT "e_consumed_in_production_purchasedPrecursorId_fkey" FOREIGN KEY ("purchasedPrecursorId") REFERENCES "purchased_precursors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbam_reports" ADD CONSTRAINT "cbam_reports_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_installationDataId_fkey" FOREIGN KEY ("installationDataId") REFERENCES "installation_datas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_section_contents" ADD CONSTRAINT "report_section_contents_reportSectionId_fkey" FOREIGN KEY ("reportSectionId") REFERENCES "report_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_verifier_representatives" ADD CONSTRAINT "report_verifier_representatives_verifierCompanyId_fkey" FOREIGN KEY ("verifierCompanyId") REFERENCES "report_verifier_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surveys" ADD CONSTRAINT "supplier_surveys_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surveys" ADD CONSTRAINT "supplier_surveys_supplierGoodId_fkey" FOREIGN KEY ("supplierGoodId") REFERENCES "supplier_goods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surveys" ADD CONSTRAINT "supplier_surveys_supplierUnitId_fkey" FOREIGN KEY ("supplierUnitId") REFERENCES "supplier_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surveys" ADD CONSTRAINT "supplier_surveys_supplierCalId_fkey" FOREIGN KEY ("supplierCalId") REFERENCES "supplier_cals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_goods" ADD CONSTRAINT "supplier_goods_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_goods" ADD CONSTRAINT "supplier_goods_goodsCategoryId_fkey" FOREIGN KEY ("goodsCategoryId") REFERENCES "goods_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_surrenders" ADD CONSTRAINT "certificate_surrenders_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "cbam_certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_surrenders" ADD CONSTRAINT "certificate_surrenders_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "annual_declarations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_allocation_adjustments" ADD CONSTRAINT "free_allocation_adjustments_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "annual_declarations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importers" ADD CONSTRAINT "importers_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
