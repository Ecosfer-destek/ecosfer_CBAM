"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  installationSchema,
  type InstallationInput,
} from "@/lib/validations/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCountries,
  getCities,
  getDistricts,
} from "@/actions/reference-data";
import { getCompanies } from "@/actions/company";
import { createInstallation, updateInstallation } from "@/actions/installation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface LookupItem {
  id: string;
  name: string;
}

interface InstallationFormProps {
  installation?: InstallationInput & { id: string };
  defaultCompanyId?: string;
}

export function InstallationForm({
  installation,
  defaultCompanyId,
}: InstallationFormProps) {
  const router = useRouter();
  const isEditing = !!installation;

  const [companies, setCompanies] = useState<LookupItem[]>([]);
  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [cities, setCities] = useState<LookupItem[]>([]);
  const [districts, setDistricts] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InstallationInput>({
    resolver: zodResolver(installationSchema),
    defaultValues: installation || {
      name: "",
      companyId: defaultCompanyId || "",
    },
  });

  const countryId = watch("countryId");
  const cityId = watch("cityId");

  useEffect(() => {
    getCompanies().then((list) =>
      setCompanies(list.map((c) => ({ id: c.id, name: c.name })))
    );
    getCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (countryId) {
      getCities(countryId).then(setCities);
      setValue("cityId", null);
      setValue("districtId", null);
    } else {
      setCities([]);
    }
  }, [countryId, setValue]);

  useEffect(() => {
    if (cityId) {
      getDistricts(cityId).then(setDistricts);
      setValue("districtId", null);
    } else {
      setDistricts([]);
    }
  }, [cityId, setValue]);

  async function onSubmit(data: InstallationInput) {
    setIsSubmitting(true);
    const result = isEditing
      ? await updateInstallation(installation!.id, data)
      : await createInstallation(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        isEditing ? "Tesis güncellendi" : "Tesis oluşturuldu"
      );
      router.push("/dashboard/installations");
      router.refresh();
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>Tesis bilgilerini girin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tesis Adı *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Şirket *</Label>
              <Select
                value={watch("companyId") || ""}
                onValueChange={(v) => setValue("companyId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şirket seçin" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && (
                <p className="text-sm text-destructive">
                  {errors.companyId.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konum Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ülke</Label>
              <Select
                value={countryId || ""}
                onValueChange={(v) => setValue("countryId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ülke seçin" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Şehir</Label>
              <Select
                value={cityId || ""}
                onValueChange={(v) => setValue("cityId", v || null)}
                disabled={!countryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>İlçe</Label>
              <Select
                value={watch("districtId") || ""}
                onValueChange={(v) => setValue("districtId", v || null)}
                disabled={!cityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İlçe seçin" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea id="address" {...register("address")} rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postCode">Posta Kodu</Label>
              <Input id="postCode" {...register("postCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poBox">PK</Label>
              <Input id="poBox" {...register("poBox")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unlocode">UN/LOCODE</Label>
              <Input id="unlocode" {...register("unlocode")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Enlem</Label>
              <Input id="latitude" {...register("latitude")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Boylam</Label>
              <Input id="longitude" {...register("longitude")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Güncelle" : "Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/installations")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
