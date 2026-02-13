"use client";

import { useSearchParams } from "next/navigation";
import { EmissionForm } from "../emission-form";

export default function NewEmissionPage() {
  const searchParams = useSearchParams();
  const installationDataId =
    searchParams.get("installationDataId") || undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Emisyon</h1>
        <p className="text-muted-foreground">
          Yeni bir emisyon kaydı oluşturun
        </p>
      </div>
      <EmissionForm defaultInstallationDataId={installationDataId} />
    </div>
  );
}
