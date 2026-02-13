"use client";

import { useDeclarationWizardStore } from "@/stores/declaration-wizard-store";
import { WizardStepper } from "@/components/declaration/wizard-stepper";
import {
  StepSelectInstallation,
  StepReviewGoods,
  StepReviewEmissions,
  StepCertificateSurrender,
  StepFreeAllocation,
  StepVerification,
  StepReviewSubmit,
} from "@/components/declaration/wizard-steps";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DeclarationWizardPage() {
  const { currentStep } = useDeclarationWizardStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/declarations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yillik Beyanname Sihirbazi</h1>
          <p className="text-muted-foreground">
            7 adimda CBAM yillik beyanname olusturun
          </p>
        </div>
      </div>

      {/* Stepper */}
      <WizardStepper />

      {/* Step Content */}
      {currentStep === "select-installation" && <StepSelectInstallation />}
      {currentStep === "review-goods" && <StepReviewGoods />}
      {currentStep === "review-emissions" && <StepReviewEmissions />}
      {currentStep === "certificate-surrender" && <StepCertificateSurrender />}
      {currentStep === "free-allocation" && <StepFreeAllocation />}
      {currentStep === "verification" && <StepVerification />}
      {currentStep === "review-submit" && <StepReviewSubmit />}
    </div>
  );
}
