import { notFound } from "next/navigation";
import { getInstallationData } from "@/actions/installation-data";
import { InstallationDataTabs } from "./installation-data-tabs";
import { ExcelUploadWrapper } from "./excel-upload-wrapper";
import { PdfReportWrapper } from "./pdf-report-wrapper";

export default async function InstallationDataDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInstallationData(id);

  if (!data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tesis Verisi</h1>
        <p className="text-muted-foreground">
          {d.installation?.name} -{" "}
          {d.installation?.company?.name || ""}
          {data.startDate && (
            <>
              {" "}| {new Date(data.startDate).toLocaleDateString("tr-TR")}
              {data.endDate &&
                ` - ${new Date(data.endDate).toLocaleDateString("tr-TR")}`}
            </>
          )}
        </p>
      </div>
      <ExcelUploadWrapper installationDataId={data.id} />
      <PdfReportWrapper installationDataId={data.id} />
      <InstallationDataTabs data={d} />
    </div>
  );
}
