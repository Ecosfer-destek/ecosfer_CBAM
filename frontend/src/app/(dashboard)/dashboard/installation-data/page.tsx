import { getInstallationDataList } from "@/actions/installation-data";
import { InstallationDataListClient } from "./installation-data-list-client";

export default async function InstallationDataPage() {
  const dataList = await getInstallationDataList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tesis Verileri</h1>
        <p className="text-muted-foreground">
          CBAM raporlama donemlerine ait tesis verilerini yonetin
        </p>
      </div>
      <InstallationDataListClient dataList={dataList} />
    </div>
  );
}
