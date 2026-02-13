"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emissionSchema } from "@/lib/validations/emission";
import type { z } from "zod";

type EmissionFormValues = z.input<typeof emissionSchema>;
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
import { Separator } from "@/components/ui/separator";
import { getEmissionTypes, getEmissionMethods } from "@/actions/reference-data";
import { createEmission, updateEmission } from "@/actions/emission";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface LookupItem {
  id: string;
  name: string;
  code?: string | null;
}

interface EmissionFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emission?: any;
  defaultInstallationDataId?: string;
}

function DecimalInput({
  label,
  name,
  register,
}: {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" step="any" {...register(name)} />
    </div>
  );
}

export function EmissionForm({
  emission,
  defaultInstallationDataId,
}: EmissionFormProps) {
  const router = useRouter();
  const isEditing = !!emission;

  const [emissionTypes, setEmissionTypes] = useState<LookupItem[]>([]);
  const [emissionMethods, setEmissionMethods] = useState<LookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<EmissionFormValues>({
    resolver: zodResolver(emissionSchema),
    defaultValues: emission || {
      installationDataId: defaultInstallationDataId || "",
    },
  });

  const emissionTypeId = watch("emissionTypeId");

  // Determine emission type code from selected type
  const selectedType = emissionTypes.find((t) => t.id === emissionTypeId);
  const typeCode = selectedType?.code?.toUpperCase() || "";
  const isSS = typeCode === "SS" || typeCode === "SS_EXCL_PFC";
  const isPFC = typeCode === "PFC";
  const isES = typeCode === "ES" || typeCode === "ES_MBA" || typeCode === "MBA";

  useEffect(() => {
    getEmissionTypes().then(setEmissionTypes);
    getEmissionMethods().then(setEmissionMethods);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setIsSubmitting(true);
    const result = isEditing
      ? await updateEmission(emission.id, data)
      : await createEmission(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? "Emisyon güncellendi" : "Emisyon oluşturuldu");
      if (defaultInstallationDataId) {
        router.push(
          `/dashboard/installation-data/${defaultInstallationDataId}`
        );
      } else {
        router.push("/dashboard/emissions");
      }
      router.refresh();
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
          <CardDescription>
            Emisyon kaynağı ve yöntem bilgilerini girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kaynak Akışı Adı</Label>
              <Input {...register("sourceStreamName")} />
            </div>
            <div className="space-y-2">
              <Label>Teknoloji Tipi</Label>
              <Input {...register("technologyType")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Emisyon Tipi</Label>
              <Select
                value={emissionTypeId || ""}
                onValueChange={(v) => setValue("emissionTypeId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Emisyon tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {emissionTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code ? `${t.code} - ` : ""}
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emisyon Yöntemi</Label>
              <Select
                value={watch("emissionMethodId") || ""}
                onValueChange={(v) => setValue("emissionMethodId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yöntem seçin" />
                </SelectTrigger>
                <SelectContent>
                  {emissionMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emisyon Yöntemi 2</Label>
              <Select
                value={watch("emissionMethod2Id") || ""}
                onValueChange={(v) => setValue("emissionMethod2Id", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yöntem 2" />
                </SelectTrigger>
                <SelectContent>
                  {emissionMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SS (PFC Haric): Activity Data + Factors */}
      {(isSS || !emissionTypeId) && (
        <Card>
          <CardHeader>
            <CardTitle>SS - Aktivite Verisi ve Faktörler</CardTitle>
            <CardDescription>
              Kaynak Akışı (PFC Hariç): AD, NCV, EF, CC, OxF, ConvF, BioC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DecimalInput label="AD (Aktivite Verisi)" name="adActivityData" register={register} />
              <DecimalInput label="NCV (Net Kalorifer Değeri)" name="ncvNetCalorificValue" register={register} />
              <DecimalInput label="EF (Emisyon Faktörü)" name="efEmissionFactor" register={register} />
              <DecimalInput label="CC (Karbon İçeriği)" name="ccCarbonContent" register={register} />
              <DecimalInput label="OxF (Oksidasyon Faktörü)" name="oxfOxidationFactor" register={register} />
              <DecimalInput label="ConvF (Dönüşüm Faktörü)" name="convfConversionFactor" register={register} />
              <DecimalInput label="BioC (Biyokütle İçeriği)" name="biocBiomassContent" register={register} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* PFC Section */}
      {isPFC && (
        <Card>
          <CardHeader>
            <CardTitle>PFC - Perfluorokarbon Emisyonları</CardTitle>
            <CardDescription>
              Frekans, Süre, SEF, AEO, CE, OVC, F_C2F6, GWP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DecimalInput label="Frekans (a)" name="aFrequency" register={register} />
              <DecimalInput label="Süre (a)" name="aDuration" register={register} />
              <DecimalInput label="SEF CF4 (a)" name="aSefCf4" register={register} />
              <DecimalInput label="AEO (b)" name="bAeo" register={register} />
              <DecimalInput label="CE (b)" name="bCe" register={register} />
              <DecimalInput label="OVC (b)" name="bOvc" register={register} />
              <DecimalInput label="F(C2F6)" name="fC2f6" register={register} />
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DecimalInput label="tCF4 Emisyon" name="tCf4Emission" register={register} />
              <DecimalInput label="tC2F6 Emisyon" name="tC2f6Emission" register={register} />
              <DecimalInput label="GWP tCO2e CF4" name="tCo2eGwpCf4" register={register} />
              <DecimalInput label="GWP tCO2e C2F6" name="tCo2eGwpC2f6" register={register} />
              <DecimalInput label="tCO2e CF4 Emisyon" name="tCo2eCf4Emission" register={register} />
              <DecimalInput label="tCO2e C2F6 Emisyon" name="tCo2eC2f6Emission" register={register} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ES (MBA) Section */}
      {isES && (
        <Card>
          <CardHeader>
            <CardTitle>ES (MBA) - Ölçüm Bazlı Yaklaşım</CardTitle>
            <CardDescription>
              GHG konsantrasyonu, çalışma saatleri, baca gazı akışı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DecimalInput
                label="GHG Konsantrasyon Ortalaması"
                name="hourlyGhgConcAverage"
                register={register}
              />
              <DecimalInput
                label="Çalışma Saatleri"
                name="hoursOperating"
                register={register}
              />
              <DecimalInput
                label="Baca Gazı Akış Ortalaması"
                name="flueGasFlowAverage"
                register={register}
              />
              <DecimalInput
                label="Yıllık GHG Miktarı"
                name="annualAmountOfGhg"
                register={register}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* CO2e and Energy - Common */}
      <Card>
        <CardHeader>
          <CardTitle>CO2e ve Enerji</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DecimalInput label="Toplama Verimliliği" name="collectionEfficiency" register={register} />
            <DecimalInput label="CO2e Fosil" name="co2eFossil" register={register} />
            <DecimalInput label="CO2e Bio" name="co2eBio" register={register} />
            <DecimalInput label="Enerji İçerik Bio (TJ)" name="energyContentBioTJ" register={register} />
            <DecimalInput label="Enerji İçerik (TJ)" name="energyContentTJ" register={register} />
            <DecimalInput label="GWP tCO2e" name="gwpTco2e" register={register} />
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
          onClick={() => router.back()}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
