"use client";

import { useSearchParams } from "next/navigation";
import { InstallationForm } from "../installation-form";

export default function NewInstallationPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") || undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Tesis</h1>
        <p className="text-muted-foreground">
          Yeni bir tesis kaydi olusturun
        </p>
      </div>
      <InstallationForm defaultCompanyId={companyId} />
    </div>
  );
}
