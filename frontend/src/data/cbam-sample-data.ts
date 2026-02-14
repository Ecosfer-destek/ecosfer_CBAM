// CBAM Reference Data - Generic sector data for 6 CBAM sectors
// Emission factors from EU Implementing Regulation 2023/1773 default values

export interface SampleEmission {
  sourceStreamName: string;
  emissionTypeCode: "SS" | "PFC" | "ES";
  emissionMethodCode: string;
  typeOfGhgCode: string;
  adActivityData: number;
  adUnitCode: string;
  ncvNetCalorificValue: number | null;
  ncvUnitCode: string | null;
  efEmissionFactor: number;
  efUnitCode: string;
  ccCarbonContent: number | null;
  ccUnitCode: string | null;
  oxfOxidationFactor: number | null;
  co2eFossil: number;
  co2eBio: number;
  energyContentTJ: number | null;
}

export interface SampleFuelBalance {
  name: string;
  totalFuelInput: number;
  directFuelForCbamGoods: number;
  fuelForElectricity: number;
  directFuelForNonCbamGoods: number;
  rest: number;
  unitCode: string;
}

export interface SampleGhgBalance {
  name: string;
  totalCo2Emissions: number;
  biomassEmissions: number;
  totalN2oEmissions: number;
  totalPfcEmissions: number;
  totalDirectEmissions: number;
  totalIndirectEmissions: number;
  totalEmissions: number;
}

export interface SampleProductionProcess {
  name: string;
  goodsCategoryCode: string;
  totalProduction: number;
  producedForMarket: number;
  directlyAttributable: number;
  emissionIntensity: number;
}

export interface SampleInstallation {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  countryCode: string;
  cityName: string;
  startDate: string;
  endDate: string;
  goodsCategoryCodes: string[];
  productionRoutes: string[];
  emissions: SampleEmission[];
  fuelBalances: SampleFuelBalance[];
  ghgBalances: SampleGhgBalance[];
  productionProcesses: SampleProductionProcess[];
}

export interface SampleCompany {
  name: string;
  officialName: string;
  countryCode: string;
  address: string;
  economicActivity: string;
  email: string;
  cityName: string;
}

export interface CbamSampleSector {
  code: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  typicalEF: string;
  productionRoutes: string[];
  ghgTypes: string[];
  euRegulationRef: string;
  company: SampleCompany;
  installation: SampleInstallation;
}

export const CBAM_SAMPLE_SECTORS: CbamSampleSector[] = [
  // ========================= 1. CEMENT =========================
  {
    code: "CEMENT",
    nameKey: "cement",
    descriptionKey: "cementDesc",
    icon: "Landmark",
    typicalEF: "0.87 tCO2/t klinker",
    productionRoutes: ["DRY", "SEMI-DRY", "WET"],
    ghgTypes: ["CO2"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 3",
    company: {
      name: "Anatolya Çimento A.Ş.",
      officialName: "Anatolya Çimento Sanayi ve Ticaret A.Ş.",
      countryCode: "TR",
      address: "Organize Sanayi Bölgesi 1. Cadde No:15",
      economicActivity: "Çimento üretimi (NACE 23.51)",
      email: "info@anatolyacimento.com.tr",
      cityName: "Ankara",
    },
    installation: {
      name: "Anatolya Çimento - Çankırı Fabrikası",
      address: "Çankırı Organize Sanayi Bölgesi",
      latitude: "40.6013",
      longitude: "33.6134",
      countryCode: "TR",
      cityName: "Ankara",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["CEMENT"],
      productionRoutes: ["DRY"],
      emissions: [
        {
          sourceStreamName: "Doğalgaz (Klinker Fırını)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 45000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 45000 * 48 / 1000 * 56.1 * 0.995 = 120,548
          co2eFossil: 120548,
          co2eBio: 0,
          energyContentTJ: 2160,
        },
        {
          sourceStreamName: "Klinker Kalsinasyonu (Proses)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 800000,
          adUnitCode: "t",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 0.525,
          efUnitCode: "tCO2/t",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 800000 * 0.525 = 420,000
          co2eFossil: 420000,
          co2eBio: 0,
          energyContentTJ: null,
        },
        {
          sourceStreamName: "Petrol Koku (Alternatif Yakıt)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 15000,
          adUnitCode: "t",
          ncvNetCalorificValue: 32.4,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 97.5,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.99,
          // 15000 * 32.4 / 1000 * 97.5 * 0.99 = 46,922
          co2eFossil: 46922,
          co2eBio: 0,
          energyContentTJ: 486,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz",
          totalFuelInput: 2160,
          directFuelForCbamGoods: 1944,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 108,
          rest: 108,
          unitCode: "TJ",
        },
        {
          name: "Petrol Koku",
          totalFuelInput: 486,
          directFuelForCbamGoods: 486,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 0,
          rest: 0,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 Dengesi",
          totalCo2Emissions: 587470,
          biomassEmissions: 0,
          totalN2oEmissions: 0,
          totalPfcEmissions: 0,
          totalDirectEmissions: 587470,
          totalIndirectEmissions: 45000,
          totalEmissions: 632470,
        },
      ],
      productionProcesses: [
        {
          name: "Klinker Üretimi (Kuru Proses)",
          goodsCategoryCode: "CEMENT",
          totalProduction: 800000,
          producedForMarket: 720000,
          directlyAttributable: 587470,
          emissionIntensity: 0.734,
        },
      ],
    },
  },

  // ========================= 2. IRON & STEEL =========================
  {
    code: "IRON_STEEL",
    nameKey: "ironSteel",
    descriptionKey: "ironSteelDesc",
    icon: "Hammer",
    typicalEF: "0.14 tCO2/t (EAF)",
    productionRoutes: ["BF-BOF", "EAF", "DRI"],
    ghgTypes: ["CO2"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 4",
    company: {
      name: "Karadeniz Çelik A.Ş.",
      officialName: "Karadeniz Çelik Sanayi ve Ticaret A.Ş.",
      countryCode: "TR",
      address: "Kocaeli Sanayi Bölgesi B Blok No:42",
      economicActivity: "Çelik üretimi (NACE 24.10)",
      email: "info@karadenizcelik.com.tr",
      cityName: "Kocaeli",
    },
    installation: {
      name: "Karadeniz Çelik - Gebze EAF Tesisi",
      address: "Gebze Organize Sanayi Bölgesi",
      latitude: "40.7988",
      longitude: "29.4314",
      countryCode: "TR",
      cityName: "Kocaeli",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["IRON_STEEL"],
      productionRoutes: ["EAF"],
      emissions: [
        {
          sourceStreamName: "Elektrik Ark Fırını - Elektrot",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 3500,
          adUnitCode: "t",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 3.22,
          efUnitCode: "tCO2/t",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 3500 * 3.22 = 11,270
          co2eFossil: 11270,
          co2eBio: 0,
          energyContentTJ: null,
        },
        {
          sourceStreamName: "Doğalgaz (Ön Isıtma)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 8000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 8000 * 48 / 1000 * 56.1 * 0.995 = 21,432
          co2eFossil: 21432,
          co2eBio: 0,
          energyContentTJ: 384,
        },
        {
          sourceStreamName: "Kireçtaşı (Flaks)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 12000,
          adUnitCode: "t",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 0.44,
          efUnitCode: "tCO2/t",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 12000 * 0.44 = 5,280
          co2eFossil: 5280,
          co2eBio: 0,
          energyContentTJ: null,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz",
          totalFuelInput: 384,
          directFuelForCbamGoods: 346,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 19,
          rest: 19,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 Dengesi",
          totalCo2Emissions: 37982,
          biomassEmissions: 0,
          totalN2oEmissions: 0,
          totalPfcEmissions: 0,
          totalDirectEmissions: 37982,
          totalIndirectEmissions: 85000,
          totalEmissions: 122982,
        },
      ],
      productionProcesses: [
        {
          name: "EAF Çelik Üretimi",
          goodsCategoryCode: "IRON_STEEL",
          totalProduction: 250000,
          producedForMarket: 230000,
          directlyAttributable: 37982,
          emissionIntensity: 0.152,
        },
      ],
    },
  },

  // ========================= 3. ALUMINIUM =========================
  {
    code: "ALUMINIUM",
    nameKey: "aluminium",
    descriptionKey: "aluminiumDesc",
    icon: "Layers",
    typicalEF: "1.42 tCO2/t",
    productionRoutes: ["HALL-HEROULT", "SECONDARY"],
    ghgTypes: ["CO2", "PFC"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 5",
    company: {
      name: "Ege Alüminyum A.Ş.",
      officialName: "Ege Alüminyum Sanayi ve Ticaret A.Ş.",
      countryCode: "TR",
      address: "İzmir Atatürk Organize Sanayi Bölgesi No:78",
      economicActivity: "Alüminyum üretimi (NACE 24.42)",
      email: "info@egealuminyum.com.tr",
      cityName: "İzmir",
    },
    installation: {
      name: "Ege Alüminyum - Aliağa Elektroliz Tesisi",
      address: "Aliağa Organize Sanayi Bölgesi",
      latitude: "38.7955",
      longitude: "26.9761",
      countryCode: "TR",
      cityName: "İzmir",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["ALUMINIUM"],
      productionRoutes: ["HALL-HEROULT"],
      emissions: [
        {
          sourceStreamName: "Anot Tüketimi (Elektroliz)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 50000,
          adUnitCode: "t",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 1.5,
          efUnitCode: "tCO2/t",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 50000 * 1.5 = 75,000
          co2eFossil: 75000,
          co2eBio: 0,
          energyContentTJ: null,
        },
        {
          sourceStreamName: "Doğalgaz (Anot Pişirme)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 5000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 5000 * 48 / 1000 * 56.1 * 0.995 = 13,395
          co2eFossil: 13395,
          co2eBio: 0,
          energyContentTJ: 240,
        },
        {
          sourceStreamName: "PFC Emisyonları (Anot Etkisi)",
          emissionTypeCode: "PFC",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "PFC",
          adActivityData: 100000,
          adUnitCode: "t Al",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 0.058,
          efUnitCode: "tCO2e/t Al",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 100000 * 0.058 = 5,800
          co2eFossil: 5800,
          co2eBio: 0,
          energyContentTJ: null,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz",
          totalFuelInput: 240,
          directFuelForCbamGoods: 216,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 12,
          rest: 12,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 + PFC Dengesi",
          totalCo2Emissions: 88395,
          biomassEmissions: 0,
          totalN2oEmissions: 0,
          totalPfcEmissions: 5800,
          totalDirectEmissions: 94195,
          totalIndirectEmissions: 450000,
          totalEmissions: 544195,
        },
      ],
      productionProcesses: [
        {
          name: "Hall-Heroult Elektroliz",
          goodsCategoryCode: "ALUMINIUM",
          totalProduction: 100000,
          producedForMarket: 95000,
          directlyAttributable: 94195,
          emissionIntensity: 0.942,
        },
      ],
    },
  },

  // ========================= 4. FERTILISERS =========================
  {
    code: "FERTILISERS",
    nameKey: "fertilisers",
    descriptionKey: "fertilisersDesc",
    icon: "Sprout",
    typicalEF: "1.6-2.0 tCO2/t NH3",
    productionRoutes: ["HABER-BOSCH", "NITRIC-ACID"],
    ghgTypes: ["CO2", "N2O"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 6",
    company: {
      name: "Akdeniz Gübre San. A.Ş.",
      officialName: "Akdeniz Gübre Sanayi ve Ticaret A.Ş.",
      countryCode: "TR",
      address: "Mersin Serbest Bölge Yolu No:25",
      economicActivity: "Gübre üretimi (NACE 20.15)",
      email: "info@akdenizgubre.com.tr",
      cityName: "Mersin",
    },
    installation: {
      name: "Akdeniz Gübre - Mersin Amonyak Tesisi",
      address: "Mersin Organize Sanayi Bölgesi",
      latitude: "36.7990",
      longitude: "34.6322",
      countryCode: "TR",
      cityName: "Mersin",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["FERTILISERS"],
      productionRoutes: ["HABER-BOSCH"],
      emissions: [
        {
          sourceStreamName: "Doğalgaz (Hammadde + Yakıt)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 120000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 120000 * 48 / 1000 * 56.1 * 0.995 = 321,462
          co2eFossil: 321462,
          co2eBio: 0,
          energyContentTJ: 5760,
        },
        {
          sourceStreamName: "N2O Emisyonları (Nitrik Asit)",
          emissionTypeCode: "ES",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "N2O",
          adActivityData: 80000,
          adUnitCode: "t HNO3",
          ncvNetCalorificValue: null,
          ncvUnitCode: null,
          efEmissionFactor: 0.0045,
          efUnitCode: "tN2O/t HNO3",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: null,
          // 80000 * 0.0045 * 265 (GWP) = 95,400 tCO2e
          co2eFossil: 95400,
          co2eBio: 0,
          energyContentTJ: null,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz",
          totalFuelInput: 5760,
          directFuelForCbamGoods: 5184,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 288,
          rest: 288,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 + N2O Dengesi",
          totalCo2Emissions: 321462,
          biomassEmissions: 0,
          totalN2oEmissions: 95400,
          totalPfcEmissions: 0,
          totalDirectEmissions: 416862,
          totalIndirectEmissions: 25000,
          totalEmissions: 441862,
        },
      ],
      productionProcesses: [
        {
          name: "Haber-Bosch Amonyak Sentezi",
          goodsCategoryCode: "FERTILISERS",
          totalProduction: 200000,
          producedForMarket: 180000,
          directlyAttributable: 416862,
          emissionIntensity: 2.084,
        },
      ],
    },
  },

  // ========================= 5. HYDROGEN =========================
  {
    code: "HYDROGEN",
    nameKey: "hydrogen",
    descriptionKey: "hydrogenDesc",
    icon: "Atom",
    typicalEF: "9-12 tCO2/t H2",
    productionRoutes: ["SMR", "ATR", "ELECTROLYSIS"],
    ghgTypes: ["CO2"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 7",
    company: {
      name: "Marmara H2 Enerji A.Ş.",
      officialName: "Marmara Hidrojen Enerji Sanayi A.Ş.",
      countryCode: "TR",
      address: "Kocaeli Petrokimya Bölgesi No:9",
      economicActivity: "Hidrojen üretimi (NACE 20.11)",
      email: "info@marmarah2.com.tr",
      cityName: "Kocaeli",
    },
    installation: {
      name: "Marmara H2 - Dilovası SMR Tesisi",
      address: "Dilovası Kimya Organize Sanayi Bölgesi",
      latitude: "40.7670",
      longitude: "29.5480",
      countryCode: "TR",
      cityName: "Kocaeli",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["HYDROGEN"],
      productionRoutes: ["SMR"],
      emissions: [
        {
          sourceStreamName: "Doğalgaz (SMR Hammadde)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 90000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 90000 * 48 / 1000 * 56.1 * 0.995 = 241,097
          co2eFossil: 241097,
          co2eBio: 0,
          energyContentTJ: 4320,
        },
        {
          sourceStreamName: "Doğalgaz (Yakıt - Reformer Isıtma)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 30000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 30000 * 48 / 1000 * 56.1 * 0.995 = 80,366
          co2eFossil: 80366,
          co2eBio: 0,
          energyContentTJ: 1440,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz (Toplam)",
          totalFuelInput: 5760,
          directFuelForCbamGoods: 5184,
          fuelForElectricity: 0,
          directFuelForNonCbamGoods: 288,
          rest: 288,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 Dengesi",
          totalCo2Emissions: 321463,
          biomassEmissions: 0,
          totalN2oEmissions: 0,
          totalPfcEmissions: 0,
          totalDirectEmissions: 321463,
          totalIndirectEmissions: 5000,
          totalEmissions: 326463,
        },
      ],
      productionProcesses: [
        {
          name: "Buhar Metan Reformasyonu (SMR)",
          goodsCategoryCode: "HYDROGEN",
          totalProduction: 30000,
          producedForMarket: 28000,
          directlyAttributable: 321463,
          emissionIntensity: 10.715,
        },
      ],
    },
  },

  // ========================= 6. ELECTRICITY =========================
  {
    code: "ELECTRICITY",
    nameKey: "electricity",
    descriptionKey: "electricityDesc",
    icon: "Zap",
    typicalEF: "0.90 tCO2/MWh",
    productionRoutes: ["NATURAL_GAS_CCGT", "COAL", "LIGNITE"],
    ghgTypes: ["CO2", "N2O"],
    euRegulationRef: "EU 2023/1773 Annex III, Section 2",
    company: {
      name: "Trakya Enerji Üretim A.Ş.",
      officialName: "Trakya Enerji Üretim Sanayi ve Ticaret A.Ş.",
      countryCode: "TR",
      address: "Tekirdağ Yolu 5. km No:3",
      economicActivity: "Elektrik üretimi (NACE 35.11)",
      email: "info@trakyaenerji.com.tr",
      cityName: "Tekirdağ",
    },
    installation: {
      name: "Trakya Enerji - Tekirdağ Doğalgaz Santrali",
      address: "Tekirdağ Enerji Üretim Bölgesi",
      latitude: "41.0027",
      longitude: "27.5127",
      countryCode: "TR",
      cityName: "Tekirdağ",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      goodsCategoryCodes: ["ELECTRICITY"],
      productionRoutes: ["NATURAL_GAS_CCGT"],
      emissions: [
        {
          sourceStreamName: "Doğalgaz (CCGT Türbin)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 350000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 350000 * 48 / 1000 * 56.1 * 0.995 = 937,870
          co2eFossil: 937870,
          co2eBio: 0,
          energyContentTJ: 16800,
        },
        {
          sourceStreamName: "Doğalgaz (Yardımcı Kazan)",
          emissionTypeCode: "SS",
          emissionMethodCode: "Calculation based - Standard",
          typeOfGhgCode: "CO2",
          adActivityData: 5000,
          adUnitCode: "t",
          ncvNetCalorificValue: 48.0,
          ncvUnitCode: "GJ/t",
          efEmissionFactor: 56.1,
          efUnitCode: "tCO2/TJ",
          ccCarbonContent: null,
          ccUnitCode: null,
          oxfOxidationFactor: 0.995,
          // 5000 * 48 / 1000 * 56.1 * 0.995 = 13,398
          co2eFossil: 13398,
          co2eBio: 0,
          energyContentTJ: 240,
        },
      ],
      fuelBalances: [
        {
          name: "Doğalgaz (Toplam)",
          totalFuelInput: 17040,
          directFuelForCbamGoods: 16800,
          fuelForElectricity: 16800,
          directFuelForNonCbamGoods: 0,
          rest: 240,
          unitCode: "TJ",
        },
      ],
      ghgBalances: [
        {
          name: "CO2 Dengesi",
          totalCo2Emissions: 951268,
          biomassEmissions: 0,
          totalN2oEmissions: 0,
          totalPfcEmissions: 0,
          totalDirectEmissions: 951268,
          totalIndirectEmissions: 0,
          totalEmissions: 951268,
        },
      ],
      productionProcesses: [
        {
          name: "Kombine Çevrim Doğalgaz Santrali",
          goodsCategoryCode: "ELECTRICITY",
          totalProduction: 1200000,
          producedForMarket: 1150000,
          directlyAttributable: 951268,
          emissionIntensity: 0.793,
        },
      ],
    },
  },
];
