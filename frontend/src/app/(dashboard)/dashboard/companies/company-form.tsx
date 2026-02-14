"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyInput } from "@/lib/validations/company";
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
import { getCountries, getCities, getDistricts, getTaxOffices } from "@/actions/reference-data";
import { createCompany, updateCompany } from "@/actions/company";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface LookupItem {
  id: string;
  name: string;
}

interface CompanyFormProps {
  company?: CompanyInput & { id: string };
}

export function CompanyForm({ company }: CompanyFormProps) {
  const t = useTranslations("company");
  const tc = useTranslations("common");
  const router = useRouter();
  const isEditing = !!company;

  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [cities, setCities] = useState<LookupItem[]>([]);
  const [districts, setDistricts] = useState<LookupItem[]>([]);
  const [taxOffices, setTaxOffices] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: company || { name: "" },
  });

  const countryId = watch("countryId");
  const cityId = watch("cityId");

  useEffect(() => {
    getCountries().then(setCountries);
    getTaxOffices().then(setTaxOffices);
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

  async function onSubmit(data: CompanyInput) {
    setIsSubmitting(true);
    const result = isEditing
      ? await updateCompany(company!.id, data)
      : await createCompany(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? t("updated") : t("created"));
      router.push("/dashboard/companies");
      router.refresh();
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("basicInfo")}</CardTitle>
          <CardDescription>{t("basicInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="officialName">{t("officialName")}</Label>
              <Input id="officialName" {...register("officialName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">{t("taxNumber")}</Label>
              <Input id="taxNumber" {...register("taxNumber")} maxLength={11} />
              {errors.taxNumber && (
                <p className="text-sm text-destructive">
                  {errors.taxNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="economicActivity">{t("economicActivity")}</Label>
              <Input
                id="economicActivity"
                {...register("economicActivity")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("locationInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("country")}</Label>
              <Select
                value={countryId || ""}
                onValueChange={(v) => setValue("countryId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCountry")} />
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
              <Label>{t("city")}</Label>
              <Select
                value={cityId || ""}
                onValueChange={(v) => setValue("cityId", v || null)}
                disabled={!countryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCity")} />
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
              <Label>{t("district")}</Label>
              <Select
                value={watch("districtId") || ""}
                onValueChange={(v) => setValue("districtId", v || null)}
                disabled={!cityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDistrict")} />
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
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea id="address" {...register("address")} rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postCode">{t("postalCode")}</Label>
              <Input id="postCode" {...register("postCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poBox">{t("poBox")}</Label>
              <Input id="poBox" {...register("poBox")} />
            </div>
            <div className="space-y-2">
              <Label>{t("taxOffice")}</Label>
              <Select
                value={watch("taxOfficeId") || ""}
                onValueChange={(v) => setValue("taxOfficeId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectTaxOffice")} />
                </SelectTrigger>
                <SelectContent>
                  {taxOffices.map((to) => (
                    <SelectItem key={to.id} value={to.id}>
                      {to.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t("latitude")}</Label>
              <Input id="latitude" {...register("latitude")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t("longitude")}</Label>
              <Input id="longitude" {...register("longitude")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unlocode">{t("unLocode")}</Label>
              <Input id="unlocode" {...register("unlocode")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("contactInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? tc("update") : tc("create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/companies")}
        >
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
