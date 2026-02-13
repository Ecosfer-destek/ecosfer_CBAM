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
import { ArrowLeft, Building2, FileSpreadsheet, Pencil } from "lucide-react";
import Link from "next/link";
import { InstallationForm } from "../installation-form";

interface InstallationDetail {
  id: string;
  name: string;
  companyId: string;
  address: string | null;
  postCode: string | null;
  poBox: string | null;
  latitude: string | null;
  longitude: string | null;
  unlocode: string | null;
  email: string | null;
  phone: string | null;
  countryId: string | null;
  cityId: string | null;
  districtId: string | null;
  company: { id: string; name: string } | null;
  country: { id: string; name: string } | null;
  city: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  installationDatas: {
    id: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

export function InstallationDetailClient({
  installation,
}: {
  installation: InstallationDetail;
}) {
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tesis Duzenle</h1>
          <p className="text-muted-foreground">{installation.name}</p>
        </div>
        <InstallationForm installation={installation} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/installations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{installation.name}</h1>
            <Link
              href={`/dashboard/companies/${installation.company?.id}`}
              className="text-sm text-primary hover:underline"
            >
              {installation.company?.name}
            </Link>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/installations/${installation.id}?edit=true`}>
            <Pencil className="mr-2 h-4 w-4" />
            Duzenle
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
            <InfoRow label="Tesis Adi" value={installation.name} />
            <InfoRow label="Sirket" value={installation.company?.name} />
            <InfoRow label="E-posta" value={installation.email} />
            <InfoRow label="Telefon" value={installation.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konum</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Ulke" value={installation.country?.name} />
            <InfoRow label="Sehir" value={installation.city?.name} />
            <InfoRow label="Ilce" value={installation.district?.name} />
            <InfoRow label="Adres" value={installation.address} />
            <InfoRow label="Posta Kodu" value={installation.postCode} />
            <InfoRow label="UN/LOCODE" value={installation.unlocode} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Tesis Verileri
            </CardTitle>
            <CardDescription>
              Bu tesise ait {installation.installationDatas.length} veri kaydi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {installation.installationDatas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henuz veri kaydi bulunmuyor
              </p>
            ) : (
              <div className="space-y-2">
                {installation.installationDatas.map((data) => (
                  <Link
                    key={data.id}
                    href={`/dashboard/installation-data/${data.id}`}
                    className="block"
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                    >
                      {data.startDate
                        ? new Date(data.startDate).toLocaleDateString("tr-TR")
                        : "?"}{" "}
                      -{" "}
                      {data.endDate
                        ? new Date(data.endDate).toLocaleDateString("tr-TR")
                        : "?"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/installation-data/new?installationId=${installation.id}`}
                >
                  Yeni Veri Kaydi Ekle
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
