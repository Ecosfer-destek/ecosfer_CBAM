import { getInstallations } from "@/actions/installation";
import { InstallationListClient } from "./installation-list-client";

export default async function InstallationsPage() {
  const installations = await getInstallations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tesisler</h1>
        <p className="text-muted-foreground">
          CBAM kapsamindaki tesisleri yonetin
        </p>
      </div>
      <InstallationListClient installations={installations} />
    </div>
  );
}
