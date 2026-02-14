import { CompanyForm } from "../company-form";
import { getTranslations } from "next-intl/server";

export default async function NewCompanyPage() {
  const t = await getTranslations("company");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("createTitle")}</h1>
        <p className="text-muted-foreground">
          {t("createDesc")}
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
