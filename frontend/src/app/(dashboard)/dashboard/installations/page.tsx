import { getInstallations } from "@/actions/installation";
import { InstallationListClient } from "./installation-list-client";
import { getTranslations } from "next-intl/server";

export default async function InstallationsPage() {
  const installations = await getInstallations();
  const t = await getTranslations("installation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <InstallationListClient installations={installations} />
    </div>
  );
}
