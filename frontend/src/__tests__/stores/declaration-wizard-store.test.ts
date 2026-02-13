import { describe, it, expect, beforeEach } from "vitest";
import { useDeclarationWizardStore, WIZARD_STEPS } from "@/stores/declaration-wizard-store";

describe("DeclarationWizardStore", () => {
  beforeEach(() => {
    useDeclarationWizardStore.getState().reset();
  });

  it("starts at select-installation step", () => {
    const state = useDeclarationWizardStore.getState();
    expect(state.currentStep).toBe("select-installation");
  });

  it("has correct number of wizard steps", () => {
    expect(WIZARD_STEPS).toHaveLength(7);
  });

  it("WIZARD_STEPS have sequential step numbers", () => {
    WIZARD_STEPS.forEach((step, idx) => {
      expect(step.step).toBe(idx + 1);
    });
  });

  describe("navigation", () => {
    it("nextStep advances to next step", () => {
      const store = useDeclarationWizardStore.getState();
      store.nextStep();
      expect(useDeclarationWizardStore.getState().currentStep).toBe("review-goods");
    });

    it("prevStep goes back", () => {
      const store = useDeclarationWizardStore.getState();
      store.setCurrentStep("review-emissions");
      store.prevStep();
      expect(useDeclarationWizardStore.getState().currentStep).toBe("review-goods");
    });

    it("nextStep does nothing at last step", () => {
      const store = useDeclarationWizardStore.getState();
      store.setCurrentStep("review-submit");
      store.nextStep();
      expect(useDeclarationWizardStore.getState().currentStep).toBe("review-submit");
    });

    it("prevStep does nothing at first step", () => {
      const store = useDeclarationWizardStore.getState();
      store.prevStep();
      expect(useDeclarationWizardStore.getState().currentStep).toBe("select-installation");
    });

    it("setCurrentStep sets step directly", () => {
      const store = useDeclarationWizardStore.getState();
      store.setCurrentStep("verification");
      expect(useDeclarationWizardStore.getState().currentStep).toBe("verification");
    });

    it("can navigate through all steps sequentially", () => {
      const store = useDeclarationWizardStore.getState();
      for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
        store.nextStep();
      }
      expect(useDeclarationWizardStore.getState().currentStep).toBe("review-submit");
    });
  });

  describe("installation selection", () => {
    it("setInstallation stores data", () => {
      const store = useDeclarationWizardStore.getState();
      const installation = {
        installationId: "inst-1",
        installationName: "Test Installation",
        installationDataId: "data-1",
        companyName: "Ecosfer",
      };
      store.setInstallation(installation);
      expect(useDeclarationWizardStore.getState().installation).toEqual(installation);
    });

    it("setYear updates year", () => {
      const store = useDeclarationWizardStore.getState();
      store.setYear(2025);
      expect(useDeclarationWizardStore.getState().year).toBe(2025);
    });
  });

  describe("goods and emissions", () => {
    it("setGoods stores goods array", () => {
      const store = useDeclarationWizardStore.getState();
      const goods = [
        { id: "1", categoryName: "Cement", cnCode: "2523", routeType: "A", routes: "Route 1" },
      ];
      store.setGoods(goods);
      expect(useDeclarationWizardStore.getState().goods).toEqual(goods);
    });

    it("setEmissions stores emissions array", () => {
      const store = useDeclarationWizardStore.getState();
      const emissions = [
        { id: "1", sourceStream: "Coal", type: "SS", method: "Calc", co2eFossil: 100, co2eBio: 5 },
      ];
      store.setEmissions(emissions);
      expect(useDeclarationWizardStore.getState().emissions).toEqual(emissions);
    });
  });

  describe("certificate surrenders", () => {
    it("addCertificateSurrender appends item", () => {
      const store = useDeclarationWizardStore.getState();
      store.addCertificateSurrender({
        certificateId: "cert-1",
        certificateNo: "CBAM-001",
        quantity: 5,
        surrenderDate: "2025-06-01",
      });
      expect(useDeclarationWizardStore.getState().certificateSurrenders).toHaveLength(1);
    });

    it("removeCertificateSurrender removes by index", () => {
      const store = useDeclarationWizardStore.getState();
      store.addCertificateSurrender({
        certificateId: "cert-1",
        certificateNo: "CBAM-001",
        quantity: 5,
        surrenderDate: "2025-06-01",
      });
      store.addCertificateSurrender({
        certificateId: "cert-2",
        certificateNo: "CBAM-002",
        quantity: 3,
        surrenderDate: "2025-07-01",
      });
      store.removeCertificateSurrender(0);
      const state = useDeclarationWizardStore.getState();
      expect(state.certificateSurrenders).toHaveLength(1);
      expect(state.certificateSurrenders[0].certificateNo).toBe("CBAM-002");
    });
  });

  describe("free allocations", () => {
    it("addFreeAllocation appends item", () => {
      const store = useDeclarationWizardStore.getState();
      store.addFreeAllocation({
        adjustmentType: "deduction",
        amount: 50,
        description: "EU ETS allocation",
      });
      expect(useDeclarationWizardStore.getState().freeAllocations).toHaveLength(1);
    });

    it("removeFreeAllocation removes by index", () => {
      const store = useDeclarationWizardStore.getState();
      store.addFreeAllocation({ adjustmentType: "a", amount: 1, description: "" });
      store.addFreeAllocation({ adjustmentType: "b", amount: 2, description: "" });
      store.removeFreeAllocation(0);
      expect(useDeclarationWizardStore.getState().freeAllocations).toHaveLength(1);
      expect(useDeclarationWizardStore.getState().freeAllocations[0].adjustmentType).toBe("b");
    });
  });

  describe("verification", () => {
    it("setVerification merges partial data", () => {
      const store = useDeclarationWizardStore.getState();
      store.setVerification({ verifierName: "TUV SUD" });
      const state = useDeclarationWizardStore.getState();
      expect(state.verification.verifierName).toBe("TUV SUD");
      expect(state.verification.opinion).toBe("UNQUALIFIED"); // default preserved
    });

    it("setVerification can update multiple fields", () => {
      const store = useDeclarationWizardStore.getState();
      store.setVerification({
        verifierName: "TUV SUD",
        accreditationNo: "ACC-123",
        opinion: "QUALIFIED",
      });
      const state = useDeclarationWizardStore.getState();
      expect(state.verification.verifierName).toBe("TUV SUD");
      expect(state.verification.accreditationNo).toBe("ACC-123");
      expect(state.verification.opinion).toBe("QUALIFIED");
    });
  });

  describe("notes and declarationId", () => {
    it("setNotes stores notes", () => {
      const store = useDeclarationWizardStore.getState();
      store.setNotes("Test notes for declaration");
      expect(useDeclarationWizardStore.getState().notes).toBe("Test notes for declaration");
    });

    it("setDeclarationId stores ID", () => {
      const store = useDeclarationWizardStore.getState();
      store.setDeclarationId("decl-123");
      expect(useDeclarationWizardStore.getState().declarationId).toBe("decl-123");
    });
  });

  describe("reset", () => {
    it("reset clears all state", () => {
      const store = useDeclarationWizardStore.getState();

      // Populate state
      store.setCurrentStep("verification");
      store.setYear(2024);
      store.setInstallation({
        installationId: "i-1",
        installationName: "Test",
        installationDataId: "d-1",
        companyName: "Co",
      });
      store.setGoods([{ id: "1", categoryName: "C", cnCode: "2523", routeType: "A", routes: "" }]);
      store.addCertificateSurrender({
        certificateId: "c-1",
        certificateNo: "N-1",
        quantity: 1,
        surrenderDate: "2025-01-01",
      });
      store.setNotes("Some notes");
      store.setDeclarationId("d-1");

      // Reset
      store.reset();
      const state = useDeclarationWizardStore.getState();

      expect(state.currentStep).toBe("select-installation");
      expect(state.installation).toBeNull();
      expect(state.goods).toHaveLength(0);
      expect(state.emissions).toHaveLength(0);
      expect(state.certificateSurrenders).toHaveLength(0);
      expect(state.freeAllocations).toHaveLength(0);
      expect(state.notes).toBe("");
      expect(state.declarationId).toBeNull();
      expect(state.verification.verifierName).toBe("");
    });
  });
});
