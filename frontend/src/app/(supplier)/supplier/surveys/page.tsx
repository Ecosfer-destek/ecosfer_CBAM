"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function SupplierSurveysPage() {
  const t = useTranslations("supplier");
  const tCommon = useTranslations("common");
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
      toast.success(t("survey.created"));
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
      toast.success(t("survey.submitted"));
      reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("survey.confirmDelete"))) return;
    const result = await deleteSupplierSurvey(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(t("survey.deleted"));
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("survey.surveysTitle")}</h1>
          <p className="text-muted-foreground">
            {t("survey.surveysSubtitle")}
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("survey.newSurvey")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("survey.newSurveyDialog")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("survey.good")}</Label>
                <Select value={goodId} onValueChange={setGoodId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("survey.goodPlaceholder")} />
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
                <Label>{t("survey.emissionFactorSource")}</Label>
                <Input
                  value={emissionFactorSource}
                  onChange={(e) => setEmissionFactorSource(e.target.value)}
                  placeholder={t("survey.emissionFactorPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.periodStart")}</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.periodEnd")}</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.specificEmissionsUnit")}</Label>
                <Input type="number" step="0.0001" value={specificEmissions} onChange={(e) => setSpecificEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.directEmissionsUnit")}</Label>
                <Input type="number" step="0.0001" value={directEmissions} onChange={(e) => setDirectEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.indirectEmissionsUnit")}</Label>
                <Input type="number" step="0.0001" value={indirectEmissions} onChange={(e) => setIndirectEmissions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.productionVolumeUnit")}</Label>
                <Input type="number" step="0.01" value={productionVolume} onChange={(e) => setProductionVolume(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.electricityConsumptionUnit")}</Label>
                <Input type="number" step="0.01" value={electricityConsumption} onChange={(e) => setElectricityConsumption(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("survey.heatConsumptionUnit")}</Label>
                <Input type="number" step="0.0001" value={heatConsumption} onChange={(e) => setHeatConsumption(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>{t("survey.monitoringMethodology")}</Label>
                <Input value={methodology} onChange={(e) => setMethodology(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>{tCommon("notes")}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{tCommon("cancel")}</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? tCommon("creating") : tCommon("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t("survey.mySurveys")}
          </CardTitle>
          <CardDescription>{t("survey.totalSurveys", { count: surveys.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("survey.good")}</TableHead>
                <TableHead>{t("survey.period")}</TableHead>
                <TableHead>{t("survey.specificEm")}</TableHead>
                <TableHead>{t("survey.directEm")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("survey.noSurveys")}
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                surveys.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.supplierGood?.name || t("survey.general")}
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
                        {t(`survey.statuses.${s.status}` as any) || s.status}
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
                            {t("survey.send")}
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
