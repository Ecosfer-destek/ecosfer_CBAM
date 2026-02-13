"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Factory, Pencil } from "lucide-react";
import Link from "next/link";
import { CompanyForm } from "../company-form";

interface CompanyDetail {
  id: string;
  name: string;
  officialName: string | null;
  taxNumber: string | null;
  address: string | null;
  postCode: string | null;
  poBox: string | null;
  latitude: string | null;
  longitude: string | null;
  unlocode: string | null;
  email: string | null;
  phone: string | null;
  economicActivity: string | null;
  countryId: string | null;
  cityId: string | null;
  districtId: string | null;
  taxOfficeId: string | null;
  country: { id: string; name: string } | null;
  city: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  taxOffice: { id: string; name: string } | null;
  installations: { id: string; name: string }[];
  companyProductionActivities: { id: string; name: string | null }[];
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

export function CompanyDetailClient({ company }: { company: CompanyDetail }) {
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Şirket Düzenle</h1>
          <p className="text-muted-foreground">{company.name}</p>
        </div>
        <CompanyForm company={company} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.officialName && (
              <p className="text-muted-foreground">{company.officialName}</p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/companies/${company.id}?edit=true`}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Şirket Adı" value={company.name} />
            <InfoRow label="Resmi Ad" value={company.officialName} />
            <InfoRow label="Vergi No" value={company.taxNumber} />
            <InfoRow label="Ekonomik Faaliyet" value={company.economicActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konum</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Ülke" value={company.country?.name} />
            <InfoRow label="Şehir" value={company.city?.name} />
            <InfoRow label="İlçe" value={company.district?.name} />
            <InfoRow label="Vergi Dairesi" value={company.taxOffice?.name} />
            <InfoRow label="Adres" value={company.address} />
            <InfoRow label="Posta Kodu" value={company.postCode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İletişim</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="E-posta" value={company.email} />
            <InfoRow label="Telefon" value={company.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Tesisler
            </CardTitle>
            <CardDescription>
              Bu şirkete ait {company.installations.length} tesis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {company.installations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz tesis bulunmuyor
              </p>
            ) : (
              <div className="space-y-2">
                {company.installations.map((inst) => (
                  <Link
                    key={inst.id}
                    href={`/dashboard/installations/${inst.id}`}
                    className="block"
                  >
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      {inst.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <Separator className="my-4" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/installations/new?companyId=${company.id}`}>
                Yeni Tesis Ekle
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
