"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { getInstallations } from "@/actions/installation";
import { createInstallationData } from "@/actions/installation-data";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LookupItem {
  id: string;
  name: string;
}

export default function NewInstallationDataPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultInstallationId =
    searchParams.get("installationId") || "";

  const [installations, setInstallations] = useState<LookupItem[]>([]);
  const [installationId, setInstallationId] = useState(defaultInstallationId);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getInstallations().then((list) =>
      setInstallations(list.map((i) => ({ id: i.id, name: i.name })))
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!installationId) {
      toast.error("Tesis secimi gereklidir");
      return;
    }
    setIsSubmitting(true);

    const result = await createInstallationData({
      installationId,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tesis verisi olusturuldu");
      router.push(`/dashboard/installation-data/${result.id}`);
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Tesis Verisi</h1>
        <p className="text-muted-foreground">
          Raporlama donemi icin yeni bir tesis veri kaydi olusturun
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Donem Bilgileri</CardTitle>
            <CardDescription>
              Tesis ve raporlama donemini secin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tesis *</Label>
              <Select
                value={installationId}
                onValueChange={setInstallationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tesis secin" />
                </SelectTrigger>
                <SelectContent>
                  {installations.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Baslangic Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitis Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Olustur
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/installation-data")}
          >
            Iptal
          </Button>
        </div>
      </form>
    </div>
  );
}
