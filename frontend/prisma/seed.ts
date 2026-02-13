import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...\n");

  // ========================================
  // 1. Tenants (3 - v1.0 databases)
  // ========================================
  const ecosferTenant = await prisma.tenant.upsert({
    where: { slug: "ecosfer" },
    update: {},
    create: { name: "Ecosfer", slug: "ecosfer", domain: "ecosfer.com" },
  });

  const roderTenant = await prisma.tenant.upsert({
    where: { slug: "roder" },
    update: {},
    create: { name: "Roder", slug: "roder", domain: "roder.com" },
  });

  const borubarTenant = await prisma.tenant.upsert({
    where: { slug: "borubar" },
    update: {},
    create: { name: "Borubar", slug: "borubar", domain: "borubar.com" },
  });

  console.log("  [1/12] Tenants:", ecosferTenant.name, roderTenant.name, borubarTenant.name);

  // ========================================
  // 2. Admin Users (one per tenant)
  // ========================================
  const passwordHash = await bcrypt.hash("Admin123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@ecosfer.com" },
    update: {},
    create: {
      email: "admin@ecosfer.com",
      name: "Ecosfer Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: ecosferTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@roder.com" },
    update: {},
    create: {
      email: "admin@roder.com",
      name: "Roder Admin",
      passwordHash,
      role: "COMPANY_ADMIN",
      tenantId: roderTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@borubar.com" },
    update: {},
    create: {
      email: "admin@borubar.com",
      name: "Borubar Admin",
      passwordHash,
      role: "COMPANY_ADMIN",
      tenantId: borubarTenant.id,
    },
  });

  // Demo operator user
  await prisma.user.upsert({
    where: { email: "operator@ecosfer.com" },
    update: {},
    create: {
      email: "operator@ecosfer.com",
      name: "Ecosfer Operator",
      passwordHash,
      role: "OPERATOR",
      tenantId: ecosferTenant.id,
    },
  });

  console.log("  [2/12] Users: 4 users created");

  // ========================================
  // 3. Countries (EU27 + Turkey + key trade partners)
  // ========================================
  const countries = [
    { code: "TR", name: "Turkiye" },
    { code: "DE", name: "Almanya" },
    { code: "FR", name: "Fransa" },
    { code: "IT", name: "Italya" },
    { code: "ES", name: "Ispanya" },
    { code: "NL", name: "Hollanda" },
    { code: "BE", name: "Belcika" },
    { code: "AT", name: "Avusturya" },
    { code: "PL", name: "Polonya" },
    { code: "SE", name: "Isvec" },
    { code: "DK", name: "Danimarka" },
    { code: "FI", name: "Finlandiya" },
    { code: "IE", name: "Irlanda" },
    { code: "PT", name: "Portekiz" },
    { code: "GR", name: "Yunanistan" },
    { code: "CZ", name: "Cek Cumhuriyeti" },
    { code: "RO", name: "Romanya" },
    { code: "HU", name: "Macaristan" },
    { code: "BG", name: "Bulgaristan" },
    { code: "HR", name: "Hirvatistan" },
    { code: "SK", name: "Slovakya" },
    { code: "SI", name: "Slovenya" },
    { code: "LT", name: "Litvanya" },
    { code: "LV", name: "Letonya" },
    { code: "EE", name: "Estonya" },
    { code: "CY", name: "Kibris" },
    { code: "MT", name: "Malta" },
    { code: "LU", name: "Luksemburg" },
    { code: "GB", name: "Birlesik Krallik" },
    { code: "US", name: "Amerika Birlesik Devletleri" },
    { code: "CN", name: "Cin" },
    { code: "IN", name: "Hindistan" },
    { code: "RU", name: "Rusya" },
    { code: "UA", name: "Ukrayna" },
    { code: "EG", name: "Misir" },
    { code: "ZA", name: "Guney Afrika" },
    { code: "BR", name: "Brezilya" },
    { code: "KR", name: "Guney Kore" },
    { code: "JP", name: "Japonya" },
  ];

  const countryMap: Record<string, string> = {};
  for (const c of countries) {
    const rec = await prisma.country.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    countryMap[c.code] = rec.id;
  }
  console.log("  [3/12] Countries:", countries.length);

  // ========================================
  // 4. Cities (Turkey major cities)
  // ========================================
  const trCities = [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya",
    "Gaziantep", "Mersin", "Kocaeli", "Diyarbakir", "Hatay", "Manisa",
    "Kayseri", "Samsun", "Denizli", "Sakarya", "Trabzon", "Eskisehir",
    "Mugla", "Balikesir", "Tekirdag", "Malatya", "Erzurum", "Kahramanmaras",
    "Ordu", "Aydin", "Van", "Duzce", "Zonguldak",
  ];

  const cityMap: Record<string, string> = {};
  for (const name of trCities) {
    const rec = await prisma.city.upsert({
      where: { name_countryId: { name, countryId: countryMap["TR"] } },
      update: {},
      create: { name, countryId: countryMap["TR"] },
    });
    cityMap[name] = rec.id;
  }
  console.log("  [4/12] Cities:", trCities.length, "(Turkey)");

  // ========================================
  // 5. Districts (sample for Istanbul & Ankara)
  // ========================================
  const istanbulDistricts = [
    "Kadikoy", "Besiktas", "Uskudar", "Sisli", "Fatih", "Bakirkoy",
    "Beyoglu", "Sariyer", "Maltepe", "Atasehir", "Umraniye", "Kartal",
    "Pendik", "Tuzla", "Avcilar", "Basaksehir", "Esenyurt", "Beylikduzu",
  ];

  for (const name of istanbulDistricts) {
    await prisma.district.upsert({
      where: { name_cityId: { name, cityId: cityMap["Istanbul"] } },
      update: {},
      create: { name, cityId: cityMap["Istanbul"] },
    });
  }

  const ankaraDistricts = [
    "Cankaya", "Kecioren", "Yenimahalle", "Mamak", "Etimesgut",
    "Sincan", "Altindag", "Pursaklar",
  ];

  for (const name of ankaraDistricts) {
    await prisma.district.upsert({
      where: { name_cityId: { name, cityId: cityMap["Ankara"] } },
      update: {},
      create: { name, cityId: cityMap["Ankara"] },
    });
  }
  console.log("  [5/12] Districts:", istanbulDistricts.length + ankaraDistricts.length);

  // ========================================
  // 6. Currencies
  // ========================================
  const currencies = [
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "TRY", name: "Turk Lirasi", symbol: "₺" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log("  [6/12] Currencies:", currencies.length);

  // ========================================
  // 7. CBAM Goods Categories + CN Codes
  // ========================================
  const goodsCategoriesData = [
    {
      code: "CEMENT",
      name: "Cement",
      cnCodes: [
        { code: "2523 10 00", name: "Cement clinkers" },
        { code: "2523 21 00", name: "White Portland cement" },
        { code: "2523 29 00", name: "Other Portland cement" },
        { code: "2523 30 00", name: "Aluminous cement" },
        { code: "2523 90 00", name: "Other hydraulic cements" },
      ],
    },
    {
      code: "IRON_STEEL",
      name: "Iron and Steel",
      cnCodes: [
        { code: "7201", name: "Pig iron and spiegeleisen" },
        { code: "7202", name: "Ferro-alloys" },
        { code: "7203", name: "Iron products by direct reduction" },
        { code: "7206", name: "Iron and non-alloy steel ingots" },
        { code: "7207", name: "Semi-finished iron or steel products" },
        { code: "7208", name: "Flat-rolled iron, hot-rolled, width >= 600mm" },
        { code: "7209", name: "Flat-rolled iron, cold-rolled, width >= 600mm" },
        { code: "7210", name: "Flat-rolled iron, plated or coated, width >= 600mm" },
        { code: "7211", name: "Flat-rolled iron, width < 600mm" },
        { code: "7213", name: "Bars and rods, hot-rolled, iron" },
        { code: "7214", name: "Other bars and rods of iron" },
        { code: "7215", name: "Other bars and rods of iron or steel" },
        { code: "7216", name: "Angles, shapes and sections of iron" },
        { code: "7217", name: "Wire of iron or non-alloy steel" },
        { code: "7218", name: "Stainless steel ingots and semi-finished" },
        { code: "7219", name: "Flat-rolled stainless steel, width >= 600mm" },
        { code: "7220", name: "Flat-rolled stainless steel, width < 600mm" },
        { code: "7221 00", name: "Bars and rods of stainless steel, hot-rolled" },
        { code: "7222", name: "Other bars and rods of stainless steel" },
        { code: "7225", name: "Flat-rolled other alloy steel, width >= 600mm" },
        { code: "7226", name: "Flat-rolled other alloy steel, width < 600mm" },
        { code: "7228", name: "Other bars/rods of alloy steel" },
        { code: "7229", name: "Wire of other alloy steel" },
        { code: "7301", name: "Sheet piling" },
        { code: "7302", name: "Railway track construction material" },
        { code: "7303 00", name: "Tubes/pipes of cast iron" },
        { code: "7304", name: "Tubes/pipes seamless iron/steel" },
        { code: "7305", name: "Other tubes/pipes, welded, circular > 406.4mm" },
        { code: "7306", name: "Other tubes, pipes iron/steel" },
        { code: "7307", name: "Tube or pipe fittings" },
        { code: "7308", name: "Structures of iron or steel" },
        { code: "7326", name: "Other articles of iron or steel" },
      ],
    },
    {
      code: "ALUMINIUM",
      name: "Aluminium",
      cnCodes: [
        { code: "7601", name: "Unwrought aluminium" },
        { code: "7603", name: "Aluminium powders and flakes" },
        { code: "7604", name: "Aluminium bars, rods and profiles" },
        { code: "7605", name: "Aluminium wire" },
        { code: "7606", name: "Aluminium plates, sheets > 0.2mm" },
        { code: "7607", name: "Aluminium foil <= 0.2mm" },
        { code: "7608", name: "Aluminium tubes and pipes" },
        { code: "7609 00 00", name: "Aluminium tube/pipe fittings" },
        { code: "7616", name: "Other articles of aluminium" },
      ],
    },
    {
      code: "FERTILIZERS",
      name: "Fertilizers",
      cnCodes: [
        { code: "2808 00 00", name: "Nitric acid; sulphonitric acids" },
        { code: "2814", name: "Ammonia, anhydrous or in aqueous solution" },
        { code: "2834 21 00", name: "Nitrates of potassium" },
        { code: "3102", name: "Mineral or chemical nitrogenous fertilizers" },
        { code: "3105", name: "Mineral or chemical fertilizers with NPK" },
      ],
    },
    {
      code: "HYDROGEN",
      name: "Hydrogen",
      cnCodes: [
        { code: "2804 10 00", name: "Hydrogen" },
      ],
    },
    {
      code: "ELECTRICITY",
      name: "Electricity",
      cnCodes: [
        { code: "2716 00 00", name: "Electrical energy" },
      ],
    },
  ];

  for (const gc of goodsCategoriesData) {
    const cat = await prisma.goodsCategory.upsert({
      where: { code: gc.code },
      update: {},
      create: { code: gc.code, name: gc.name },
    });

    for (const cn of gc.cnCodes) {
      await prisma.cnCode.upsert({
        where: { code: cn.code },
        update: {},
        create: { code: cn.code, name: cn.name, goodsCategoryId: cat.id },
      });
    }
  }
  console.log("  [7/12] Goods Categories:", goodsCategoriesData.length,
    "with", goodsCategoriesData.reduce((s, g) => s + g.cnCodes.length, 0), "CN codes");

  // ========================================
  // 8. Production Routes
  // ========================================
  const productionRoutes = [
    { code: "BF-BOF", name: "Blast Furnace - Basic Oxygen Furnace" },
    { code: "EAF", name: "Electric Arc Furnace" },
    { code: "DRI-EAF", name: "Direct Reduced Iron - Electric Arc Furnace" },
    { code: "HALL-HEROULT", name: "Hall-Heroult Process (Primary Aluminium)" },
    { code: "RECYCLING", name: "Recycling (Secondary)" },
    { code: "WET", name: "Wet Process (Cement)" },
    { code: "DRY", name: "Dry Process (Cement)" },
    { code: "SEMI-DRY", name: "Semi-dry Process (Cement)" },
    { code: "HABER-BOSCH", name: "Haber-Bosch Process (Ammonia/Fertilizer)" },
    { code: "ELECTROLYSIS", name: "Electrolysis (Hydrogen)" },
    { code: "SMR", name: "Steam Methane Reforming (Hydrogen)" },
  ];

  for (const r of productionRoutes) {
    await prisma.productionRoute.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }
  console.log("  [8/12] Production Routes:", productionRoutes.length);

  // ========================================
  // 9. Production Processes
  // ========================================
  const productionProcesses = [
    { code: "CLINKER", name: "Clinker production" },
    { code: "CEMENT_GRINDING", name: "Cement grinding" },
    { code: "SINTERING", name: "Sintering" },
    { code: "PELLETIZING", name: "Pelletizing" },
    { code: "COKE_PRODUCTION", name: "Coke production" },
    { code: "PIG_IRON", name: "Pig iron production (blast furnace)" },
    { code: "STEEL_BOF", name: "Steel production (BOF)" },
    { code: "STEEL_EAF", name: "Steel production (EAF)" },
    { code: "HOT_ROLLING", name: "Hot rolling" },
    { code: "COLD_ROLLING", name: "Cold rolling" },
    { code: "COATING", name: "Metallic coating / galvanizing" },
    { code: "ALUMINA", name: "Alumina production (Bayer)" },
    { code: "ANODE", name: "Anode production" },
    { code: "ELECTROLYSIS_AL", name: "Electrolysis (aluminium smelting)" },
    { code: "CASTING", name: "Casting" },
    { code: "AMMONIA", name: "Ammonia production" },
    { code: "NITRIC_ACID", name: "Nitric acid production" },
    { code: "UREA", name: "Urea production" },
    { code: "MIXED_FERTILIZER", name: "Mixed fertilizer production" },
    { code: "H2_ELECTROLYSIS", name: "Hydrogen production (electrolysis)" },
    { code: "H2_SMR", name: "Hydrogen production (SMR)" },
    { code: "POWER_GEN", name: "Electricity generation" },
  ];

  for (const p of productionProcesses) {
    await prisma.productionProcess.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log("  [9/12] Production Processes:", productionProcesses.length);

  // ========================================
  // 10. Emission Types, Methods, GHG Types
  // ========================================
  const emissionTypes = [
    { code: "SS", name: "Source Stream (PFC haric)" },
    { code: "PFC", name: "PFC Emissions" },
    { code: "ES", name: "Emission Source (MBA)" },
  ];

  for (const et of emissionTypes) {
    await prisma.emissionType.upsert({
      where: { code: et.code },
      update: {},
      create: et,
    });
  }

  const emissionMethods = [
    { code: "CB-STD", name: "Calculation based - Standard methodology" },
    { code: "CB-MB", name: "Calculation based - Mass balance" },
    { code: "MB", name: "Measurement based" },
  ];

  for (const em of emissionMethods) {
    await prisma.emissionMethod.upsert({ where: { code: em.code }, update: {}, create: em });
  }

  // EmissionMethod2 - same data, different table
  for (const em of emissionMethods) {
    await prisma.emissionMethod2.upsert({ where: { code: em.code }, update: {}, create: em });
  }

  // EmissionMethod3
  for (const em of emissionMethods) {
    await prisma.emissionMethod3.upsert({ where: { code: em.code }, update: {}, create: em });
  }

  const ghgTypes = [
    { code: "CO2", name: "Carbon Dioxide", gwp: 1 },
    { code: "N2O", name: "Nitrous Oxide", gwp: 298 },
    { code: "CF4", name: "Carbon Tetrafluoride (PFC-14)", gwp: 7390 },
    { code: "C2F6", name: "Hexafluoroethane (PFC-116)", gwp: 12200 },
  ];

  for (const ghg of ghgTypes) {
    await prisma.typeOfGhg.upsert({
      where: { code: ghg.code },
      update: {},
      create: ghg,
    });
  }

  // SourceStreamName lookup
  const sourceStreamNames = [
    { code: "NATURAL_GAS", name: "Natural Gas" },
    { code: "COAL", name: "Coal" },
    { code: "FUEL_OIL", name: "Fuel Oil" },
    { code: "DIESEL", name: "Diesel" },
    { code: "PETROLEUM_COKE", name: "Petroleum Coke" },
    { code: "RAW_MEAL", name: "Raw Meal" },
    { code: "LIMESTONE", name: "Limestone" },
    { code: "IRON_ORE", name: "Iron Ore" },
    { code: "SCRAP", name: "Scrap Metal" },
    { code: "ELECTRODES", name: "Electrodes" },
    { code: "COKE", name: "Coke" },
    { code: "OTHER", name: "Other" },
  ];

  for (const ss of sourceStreamNames) {
    await prisma.sourceStreamName.upsert({
      where: { code: ss.code },
      update: {},
      create: ss,
    });
  }

  console.log("  [10/12] Emission Types:", emissionTypes.length,
    "| Methods:", emissionMethods.length, "x3",
    "| GHG:", ghgTypes.length,
    "| SourceStreams:", sourceStreamNames.length);

  // ========================================
  // 11. Unit Lookups (14 categories)
  // ========================================
  const unitSeeds = {
    aDUnit: [
      { code: "t", name: "Tonnes" },
      { code: "Nm3", name: "Normal cubic metres" },
      { code: "1000Nm3", name: "Thousand normal cubic metres" },
      { code: "kNm3", name: "Kilo normal cubic metres" },
      { code: "TJ", name: "Terajoules" },
      { code: "MWh", name: "Megawatt hours" },
      { code: "GJ", name: "Gigajoules" },
    ],
    nCVUnit: [
      { code: "GJ/t", name: "GJ per tonne" },
      { code: "GJ/1000Nm3", name: "GJ per 1000 Nm3" },
      { code: "GJ/Nm3", name: "GJ per Nm3" },
      { code: "TJ/kt", name: "TJ per kiloton" },
    ],
    eFUnit: [
      { code: "tCO2/TJ", name: "tCO2 per TJ" },
      { code: "tCO2/t", name: "tCO2 per tonne" },
      { code: "tCO2/Nm3", name: "tCO2 per Nm3" },
      { code: "tN2O/TJ", name: "tN2O per TJ" },
      { code: "tN2O/t", name: "tN2O per tonne" },
      { code: "kgCO2/GJ", name: "kgCO2 per GJ" },
    ],
    cContentUnit: [
      { code: "tC/TJ", name: "tC per TJ" },
      { code: "tC/t", name: "tC per tonne" },
      { code: "tC/Nm3", name: "tC per Nm3" },
    ],
    oxFUnit: [
      { code: "ratio", name: "Ratio (dimensionless)" },
    ],
    convFUnit: [
      { code: "ratio", name: "Ratio (dimensionless)" },
    ],
    bioCUnit: [
      { code: "%", name: "Percentage" },
      { code: "ratio", name: "Ratio (dimensionless)" },
    ],
    fuelBalanceUnit: [
      { code: "TJ", name: "Terajoules" },
      { code: "t", name: "Tonnes" },
      { code: "GJ", name: "Gigajoules" },
    ],
    ghgBalanceUnit: [
      { code: "tCO2e", name: "Tonnes CO2 equivalent" },
      { code: "tCO2", name: "Tonnes CO2" },
      { code: "tN2O", name: "Tonnes N2O" },
    ],
    ghgConcUnit: [
      { code: "%vol", name: "Volume percentage" },
      { code: "mg/Nm3", name: "mg per Nm3" },
      { code: "ppm", name: "Parts per million" },
    ],
    hoursOperatingUnit: [
      { code: "h", name: "Hours" },
      { code: "h/yr", name: "Hours per year" },
    ],
    flueGasFlowUnit: [
      { code: "Nm3/h", name: "Nm3 per hour" },
      { code: "m3/h", name: "m3 per hour" },
    ],
    annualAmountOfGhgUnit: [
      { code: "tCO2", name: "Tonnes CO2" },
      { code: "tN2O", name: "Tonnes N2O" },
      { code: "tCO2e", name: "Tonnes CO2 equivalent" },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaAny = prisma as any;
  let totalUnits = 0;
  for (const [modelName, units] of Object.entries(unitSeeds)) {
    for (const u of units) {
      await prismaAny[modelName].upsert({
        where: { code: u.code },
        update: {},
        create: u,
      });
    }
    totalUnits += units.length;
  }
  console.log("  [11/12] Unit Lookups:", totalUnits, "across 13 categories");

  // ========================================
  // 12. Roles, Scopes, Tax Offices, Quality Data
  // ========================================
  const roles = [
    { name: "SUPER_ADMIN", description: "Sistem yoneticisi - tam yetki", isSystem: true },
    { name: "COMPANY_ADMIN", description: "Sirket yoneticisi", isSystem: true },
    { name: "OPERATOR", description: "Tesis operatoru - veri girisi", isSystem: true },
    { name: "SUPPLIER", description: "Tedarikci - anket doldurma", isSystem: true },
    { name: "CBAM_DECLARANT", description: "CBAM beyancisi", isSystem: true },
    { name: "VERIFIER", description: "Dogrulayici", isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
  }

  const scopes = [
    { name: "Scope 1", description: "Direct emissions from owned or controlled sources" },
    { name: "Scope 2", description: "Indirect emissions from the generation of purchased energy" },
    { name: "Scope 3", description: "All indirect emissions in the value chain" },
  ];

  for (const scope of scopes) {
    await prisma.scope.upsert({ where: { name: scope.name }, update: {}, create: scope });
  }

  // Tax Offices (Turkey - sample)
  const taxOffices = [
    "Kadikoy VD", "Beyoglu VD", "Uskudar VD", "Mecidiyekoy VD",
    "Sariyer VD", "Bakirkoy VD", "Fatih VD", "Sisli VD",
    "Ankara Cankaya VD", "Ankara Kecioren VD",
    "Izmir Konak VD", "Bursa Osmangazi VD",
    "Kocaeli Gebze VD", "Antalya Muratpasa VD",
  ];

  for (const name of taxOffices) {
    const existing = await prisma.taxOffice.findFirst({ where: { name } });
    if (!existing) await prisma.taxOffice.create({ data: { name } });
  }

  // Quality data lookups
  const qualityInfoEntries = [
    {
      qualityLevel: "Tier 1",
      description: "Default values from regulation",
      methodDescription: "EU Implementing Regulation 2023/1773",
    },
    {
      qualityLevel: "Tier 2",
      description: "Country-specific values",
      methodDescription: "National inventory data",
    },
    {
      qualityLevel: "Tier 3",
      description: "Installation-specific measured values",
      methodDescription: "Laboratory analysis",
    },
    {
      qualityLevel: "Tier 4",
      description: "Continuous emission monitoring",
      methodDescription: "CEMS data",
    },
  ];

  for (const qi of qualityInfoEntries) {
    const existing = await prisma.generalInfoOnDataQuality.findFirst({
      where: { qualityLevel: qi.qualityLevel },
    });
    if (!existing) await prisma.generalInfoOnDataQuality.create({ data: qi });
  }

  // App Settings (compound unique: tenantId + key, tenantId is null for global)
  const appSettings = [
    { key: "CBAM_REPORTING_YEAR", value: "2026" },
    { key: "CBAM_REGULATION_VERSION", value: "2023/956" },
    { key: "DEFAULT_CURRENCY", value: "EUR" },
  ];

  for (const setting of appSettings) {
    const existing = await prisma.appSetting.findFirst({
      where: { key: setting.key, tenantId: null },
    });
    if (!existing) await prisma.appSetting.create({ data: setting });
  }

  console.log("  [12/12] Roles:", roles.length,
    "| Scopes:", scopes.length,
    "| TaxOffices:", taxOffices.length,
    "| Quality:", qualityInfoEntries.length,
    "| AppSettings: 3");

  // ========================================
  // Summary
  // ========================================
  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
