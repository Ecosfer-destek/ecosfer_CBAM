import { getEmissions } from "@/actions/emission";
import { EmissionListClient } from "./emission-list-client";
import { getTranslations } from "next-intl/server";

export default async function EmissionsPage() {
  const emissions = await getEmissions();
  const t = await getTranslations("emission");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <EmissionListClient emissions={emissions} />
    </div>
  );
}
