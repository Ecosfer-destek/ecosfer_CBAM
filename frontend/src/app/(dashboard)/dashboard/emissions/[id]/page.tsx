import { notFound } from "next/navigation";
import { getEmission } from "@/actions/emission";
import { EmissionForm } from "../emission-form";

export default async function EmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const emission = await getEmission(id);

  if (!emission) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emisyon Detay</h1>
        <p className="text-muted-foreground">
          {emission.sourceStreamName || "Isimsiz"} -{" "}
          {emission.emissionType?.code || ""}
        </p>
      </div>
      <EmissionForm
        emission={emission}
        defaultInstallationDataId={emission.installationDataId || undefined}
      />
    </div>
  );
}
