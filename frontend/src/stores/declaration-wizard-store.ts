import { create } from "zustand";

export type WizardStep =
  | "select-installation"
  | "review-goods"
  | "review-emissions"
  | "certificate-surrender"
  | "free-allocation"
  | "verification"
  | "review-submit";

export const WIZARD_STEPS: { key: WizardStep; label: string; step: number }[] = [
  { key: "select-installation", label: "Tesis ve Yıl Seç", step: 1 },
  { key: "review-goods", label: "İthal Mallar", step: 2 },
  { key: "review-emissions", label: "Gömülü Emisyonlar", step: 3 },
  { key: "certificate-surrender", label: "Sertifika Teslimi", step: 4 },
  { key: "free-allocation", label: "Ücretsiz Tahsis", step: 5 },
  { key: "verification", label: "Doğrulama", step: 6 },
  { key: "review-submit", label: "İnceleme ve Gönder", step: 7 },
];

interface InstallationSelection {
  installationId: string;
  installationName: string;
  installationDataId: string;
  companyName: string;
}

interface GoodsItem {
  id: string;
  categoryName: string;
  cnCode: string;
  routeType: string;
  routes: string;
}

interface EmissionItem {
  id: string;
  sourceStream: string;
  type: string;
  method: string;
  co2eFossil: number;
  co2eBio: number;
}

interface CertificateSurrenderItem {
  certificateId: string;
  certificateNo: string;
  quantity: number;
  surrenderDate: string;
}

interface FreeAllocationItem {
  adjustmentType: string;
  amount: number;
  description: string;
}

interface VerificationInfo {
  verifierName: string;
  accreditationNo: string;
  opinion: string;
  period: string;
  notes: string;
}

interface DeclarationWizardState {
  // Current step
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1: Installation selection
  year: number;
  setYear: (year: number) => void;
  installation: InstallationSelection | null;
  setInstallation: (installation: InstallationSelection | null) => void;

  // Step 2: Goods
  goods: GoodsItem[];
  setGoods: (goods: GoodsItem[]) => void;

  // Step 3: Emissions
  emissions: EmissionItem[];
  setEmissions: (emissions: EmissionItem[]) => void;

  // Step 4: Certificate surrenders
  certificateSurrenders: CertificateSurrenderItem[];
  addCertificateSurrender: (item: CertificateSurrenderItem) => void;
  removeCertificateSurrender: (index: number) => void;

  // Step 5: Free allocation
  freeAllocations: FreeAllocationItem[];
  addFreeAllocation: (item: FreeAllocationItem) => void;
  removeFreeAllocation: (index: number) => void;

  // Step 6: Verification
  verification: VerificationInfo;
  setVerification: (info: Partial<VerificationInfo>) => void;

  // Step 7: Notes / submission
  notes: string;
  setNotes: (notes: string) => void;

  // Declaration result
  declarationId: string | null;
  setDeclarationId: (id: string | null) => void;

  // Reset
  reset: () => void;
}

const initialVerification: VerificationInfo = {
  verifierName: "",
  accreditationNo: "",
  opinion: "UNQUALIFIED",
  period: "",
  notes: "",
};

export const useDeclarationWizardStore = create<DeclarationWizardState>(
  (set, get) => ({
    currentStep: "select-installation",
    setCurrentStep: (step) => set({ currentStep: step }),
    nextStep: () => {
      const idx = WIZARD_STEPS.findIndex((s) => s.key === get().currentStep);
      if (idx < WIZARD_STEPS.length - 1) {
        set({ currentStep: WIZARD_STEPS[idx + 1].key });
      }
    },
    prevStep: () => {
      const idx = WIZARD_STEPS.findIndex((s) => s.key === get().currentStep);
      if (idx > 0) {
        set({ currentStep: WIZARD_STEPS[idx - 1].key });
      }
    },

    year: new Date().getFullYear(),
    setYear: (year) => set({ year }),
    installation: null,
    setInstallation: (installation) => set({ installation }),

    goods: [],
    setGoods: (goods) => set({ goods }),

    emissions: [],
    setEmissions: (emissions) => set({ emissions }),

    certificateSurrenders: [],
    addCertificateSurrender: (item) =>
      set((s) => ({ certificateSurrenders: [...s.certificateSurrenders, item] })),
    removeCertificateSurrender: (index) =>
      set((s) => ({
        certificateSurrenders: s.certificateSurrenders.filter((_, i) => i !== index),
      })),

    freeAllocations: [],
    addFreeAllocation: (item) =>
      set((s) => ({ freeAllocations: [...s.freeAllocations, item] })),
    removeFreeAllocation: (index) =>
      set((s) => ({
        freeAllocations: s.freeAllocations.filter((_, i) => i !== index),
      })),

    verification: { ...initialVerification },
    setVerification: (info) =>
      set((s) => ({ verification: { ...s.verification, ...info } })),

    notes: "",
    setNotes: (notes) => set({ notes }),

    declarationId: null,
    setDeclarationId: (id) => set({ declarationId: id }),

    reset: () =>
      set({
        currentStep: "select-installation",
        year: new Date().getFullYear(),
        installation: null,
        goods: [],
        emissions: [],
        certificateSurrenders: [],
        freeAllocations: [],
        verification: { ...initialVerification },
        notes: "",
        declarationId: null,
      }),
  })
);
