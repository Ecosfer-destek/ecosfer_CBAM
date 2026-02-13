"use client";

import { PdfReportGenerator } from "@/components/reports/pdf-report-generator";

export function PdfReportWrapper({
  installationDataId,
}: {
  installationDataId: string;
}) {
  return <PdfReportGenerator installationDataId={installationDataId} />;
}
