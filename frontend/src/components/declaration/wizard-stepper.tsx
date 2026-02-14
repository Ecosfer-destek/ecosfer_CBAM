"use client";

import { WIZARD_STEPS, useDeclarationWizardStore } from "@/stores/declaration-wizard-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function WizardStepper() {
  const t = useTranslations("wizard");
  const { currentStep, setCurrentStep } = useDeclarationWizardStore();
  const currentIdx = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav className="flex items-center justify-between">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = step.key === currentStep;
        const isCompleted = idx < currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              onClick={() => {
                if (isCompleted) setCurrentStep(step.key);
              }}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                isActive && "text-primary font-semibold",
                isCompleted && "text-green-600 cursor-pointer hover:text-green-700",
                !isActive && !isCompleted && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 shrink-0",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isCompleted && "border-green-600 bg-green-600 text-white",
                  !isActive && !isCompleted && "border-muted-foreground/30"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.step}
              </span>
              <span className="hidden lg:inline">{t(step.labelKey as "step1" | "step2" | "step3" | "step4" | "step5" | "step6" | "step7")}</span>
            </button>
            {idx < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  idx < currentIdx ? "bg-green-600" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
