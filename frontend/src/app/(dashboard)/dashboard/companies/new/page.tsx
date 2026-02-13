import { CompanyForm } from "../company-form";

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Sirket</h1>
        <p className="text-muted-foreground">
          Yeni bir sirket kaydi olusturun
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
