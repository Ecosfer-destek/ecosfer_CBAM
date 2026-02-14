import { getTranslations } from "next-intl/server";
import { CbamReferenceClient } from "./cbam-reference-client";

export default async function CbamReferenceDataPage() {
  const t = await getTranslations("cbamReference");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CbamReferenceClient />
    </div>
  );
}
