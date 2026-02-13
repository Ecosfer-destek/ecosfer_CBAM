import { getEmissions } from "@/actions/emission";
import { EmissionListClient } from "./emission-list-client";

export default async function EmissionsPage() {
  const emissions = await getEmissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emisyonlar</h1>
        <p className="text-muted-foreground">
          Tesis emisyon verilerini yonetin
        </p>
      </div>
      <EmissionListClient emissions={emissions} />
    </div>
  );
}
