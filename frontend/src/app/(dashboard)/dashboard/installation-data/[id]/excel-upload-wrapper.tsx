"use client";

import { ExcelUpload } from "@/components/excel/excel-upload";
import { useRouter } from "next/navigation";

export function ExcelUploadWrapper({
  installationDataId,
}: {
  installationDataId: string;
}) {
  const router = useRouter();

  return (
    <ExcelUpload
      installationDataId={installationDataId}
      onImportComplete={() => router.refresh()}
    />
  );
}
