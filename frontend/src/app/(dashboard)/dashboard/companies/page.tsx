import { getCompanies } from "@/actions/company";
import { CompanyListClient } from "./company-list-client";
import { getTranslations } from "next-intl/server";

export default async function CompaniesPage() {
  const companies = await getCompanies();
  const t = await getTranslations("company");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <CompanyListClient companies={companies} />
    </div>
  );
}
