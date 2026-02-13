import { getCompanies } from "@/actions/company";
import { CompanyListClient } from "./company-list-client";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Şirketler</h1>
        <p className="text-muted-foreground">
          CBAM kapsamındaki şirketleri yönetin
        </p>
      </div>
      <CompanyListClient companies={companies} />
    </div>
  );
}
