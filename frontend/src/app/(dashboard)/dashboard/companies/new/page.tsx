import { CompanyForm } from "../company-form";

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Şirket</h1>
        <p className="text-muted-foreground">
          Yeni bir şirket kaydı oluşturun
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
