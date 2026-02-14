import { getInstallationDataList } from "@/actions/installation-data";
import { InstallationDataListClient } from "./installation-data-list-client";
import { getTranslations } from "next-intl/server";

export default async function InstallationDataPage() {
  const dataList = await getInstallationDataList();
  const t = await getTranslations("installationData");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <InstallationDataListClient dataList={dataList} />
    </div>
  );
}
