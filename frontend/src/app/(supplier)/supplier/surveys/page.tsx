"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, Trash2, ClipboardList } from "lucide-react";
import {
  getSupplierSurveys,
  getSupplierGoods,
  createSupplierSurvey,
  submitSupplierSurvey,
  deleteSupplierSurvey,
} from "@/actions/supplier";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  SUBMITTED: "Gonderildi",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
};

export default function SupplierSurveysPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [surveys, setSurveys] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [goods, setGoods] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [goodId, setGoodId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [specificEmissions, setSpecificEmissions] = useState("");
  const [directEmissions, setDirectEmissions] = useState("");
  const [indirectEmissions, setIndirectEmissions] = useState("");
  const [productionVolume, setProductionVolume] = useState("");
  const [electricityConsumption, setElectricityConsumption] = useState("");
  const [heatConsumption, setHeatConsumption] = useState("");
  const [emissionFactorSource, setEmissionFactorSource] = useState("");
  const [methodology, setMethodology] = useState("");
  const [notes, setNotes] = useState("");

  function reload() {
    getSupplierSurveys().then(setSurveys);
  }

  useEffect(() => {
    reload();
    getSupplierGoods().then(setGoods);
  }, []);

  async function handleCreate() {
    setIsCreating(true);
    // We need a supplierId - for the supplier portal, this comes from the session
    // For now, use the first supplier available
    const result = await createSupplierSurvey({
      supplierId: surveys[0]?.supplierId || "",
      supplierGoodId: goodId || null,
      reportingPeriodStart: periodStart || null,
      reportingPeriodEnd: periodEnd || null,
      specificEmbeddedEmissions: specificEmissions ? parseFloat(specificEmissions) : null,
      directEmissions: directEmissions ? parseFloat(directEmissions) : null,
      indirectEmissions: indirectEmissions ? parseFloat(indirectEmissions) : null,
      productionVolume: productionVolume ? parseFloat(productionVolume) : null,
      electricityConsumption: electricityConsumption ? parseFloat(electricityConsumption) : null,
      heatConsumption: heatConsumption ? parseFloat(heatConsumption) : null,
      emissionFactorSource: emissionFactorSource || null,
      monitoringMethodology: methodology || null,
      notes: notes || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Anket olusturuldu");
      setShowCreate(false);
      resetForm();
      reload();
    }
    setIsCreating(false);
  }

  function resetForm() {
    setGoodId("");
    setPeriodStart("");
    setPeriodEnd("");
    setSpecificEmissions("");
    setDirectEmissions("");
    setIndirectEmissions("");
    setProductionVolume("");
    setElectricityConsumption("");
    setHeatConsumption("");
    setEmissionFactorSource("");
    setMethodology("");
    setNotes("");
  }

  async function handleSubmit(id: string) {
    const result = await submitSupplierSurvey(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Anket gonderildi");
      reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu anketi silmek istediginizden emin misiniz?")) return;
    const result = await deleteSupplierSurvey(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Anket silindi");
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emisyon Anketleri</h1>
          <p className="text-muted-foreground">
            CBAM emisyon verilerinizi gonderin
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Anket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Emisyon Anketi</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Mal</Label>
                <Select value={goodId} onValueChange={setGoodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mal secin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {goods.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Emisyon Faktoru Kaynagi</Label>
                <Input
                  value={emissionFactorSource}
                  onChange={(e) => setEmissionFactorSource(e.target.value)}
                  placeholder="ornegin: Varsayilan deger, Olcum"
                />
              </div>
              <div className="space-y-2">
                <Label>Donem Baslangic</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Donem Bitis</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Spesifik Gomulu Emisyon (tCO2e/t)</Label>
                <Input type="number" step="0.0001" value={specificEmissions} onChange={(e) => setSpecificEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dogrudan Emisyon (tCO2e)</Label>
                <Input type="number" step="0.0001" value={directEmissions} onChange={(e) => setDirectEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dolayli Emisyon (tCO2e)</Label>
                <Input type="number" step="0.0001" value={indirectEmissions} onChange={(e) => setIndirectEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Uretim Hacmi (ton)</Label>
                <Input type="number" step="0.01" value={productionVolume} onChange={(e) => setProductionVolume(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Elektrik Tuketimi (MWh)</Label>
                <Input type="number" step="0.01" value={electricityConsumption} onChange={(e) => setElectricityConsumption(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Isi Tuketimi (TJ)</Label>
                <Input type="number" step="0.0001" value={heatConsumption} onChange={(e) => setHeatConsumption(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Izleme Metodolojisi</Label>
                <Input value={methodology} onChange={(e) => setMethodology(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notlar</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Iptal</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Olusturuluyor..." : "Olustur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Anketlerim
          </CardTitle>
          <CardDescription>Toplam {surveys.length} anket</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mal</TableHead>
                <TableHead>Donem</TableHead>
                <TableHead>Spesifik Em.</TableHead>
                <TableHead>Dogrudan Em.</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Henuz anketiniz bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                surveys.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.supplierGood?.name || "Genel"}
                    </TableCell>
                    <TableCell>
                      {s.reportingPeriodStart
                        ? new Date(s.reportingPeriodStart).toLocaleDateString("tr-TR")
                        : "-"}{" "}
                      -{" "}
                      {s.reportingPeriodEnd
                        ? new Date(s.reportingPeriodEnd).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {s.specificEmbeddedEmissions
                        ? Number(s.specificEmbeddedEmissions).toFixed(4)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {s.directEmissions
                        ? Number(s.directEmissions).toFixed(4)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "APPROVED" ? "default" : "secondary"}>
                        {STATUS_LABELS[s.status] || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmit(s.id)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Gonder
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
